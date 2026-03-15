'use server';

import { PrismaClient, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '../../../../auth';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import prisma from '@/app/lib/prisma';

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath('/admin/users');
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error('Failed to update user role:', error);
    return { success: false, error: error.message || 'Failed to update user role' };
  }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, users };
    } catch (error: any) {
        console.error('Failed to fetch users:', error);
        return { success: false, error: error.message || 'Failed to fetch users' };
    }
}

const CreateUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "TESTER"]),
});

export async function createUser(prevState: any, formData: FormData) {
    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create User.',
        };
    }

    const { name, email, password, role } = validatedFields.data;

    const session = await auth();
    const currentUserRole = session?.user?.role;
    if (currentUserRole === 'PROJECT_MANAGER' && role === 'ADMIN') {
        return { message: 'Unauthorized: Project Managers cannot create Admin users.' };
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { message: 'Email already exists.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
            },
        });

        if (session?.user?.id) {
            await prisma.systemActionLog.create({
                data: {
                    action: 'CREATE',
                    entityType: 'USER',
                    entityId: newUser.id,
                    details: `Created new user ${name} (${email}) with role ${role}`,
                    performedById: session.user.id
                }
            });
        }

        const settings = await prisma.smtpSettings.findFirst();
        if (settings) {
            try {
                const { sendMail } = await import('../mail');
                await sendMail({
                    to: email,
                    subject: "Welcome to QA Portal",
                    html: `<b>Hello ${name},</b><br/><br/>Your account has been created by an administrator. Here are your temporary login details:<br/><br/>Email: <strong>${email}</strong><br/>Password: <strong>${password}</strong><br/><br/>Please login and change your password immediately.`,
                });
            } catch (emailErr) {
                console.error("Failed to send welcome email:", emailErr);
            }
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'User created successfully.' };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to Create User.' };
    }
}

export async function updateNotificationPreference(enabled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { notificationsEnabled: enabled }
        });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error("Failed to update notification settings", e);
        return { error: "Failed to update notification settings" };
    }
}

export async function updatePassword(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { message: "All fields are required" };
    }

    if (newPassword !== confirmPassword) {
        return { message: "New passwords do not match" };
    }

    if (newPassword.length < 6) {
        return { message: "New password must be at least 6 characters long" };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) {
            return { message: "User not found or using external provider" };
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { message: "Incorrect current password" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return { success: true, message: 'Password updated successfully' };
    } catch (error) {
        console.error("Failed to update password:", error);
        return { message: "Failed to update password. Please try again." };
    }
}

export async function updatePasswordForce(newPassword: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    if (!newPassword || newPassword.length < 6) {
        return { message: "New password must be at least 6 characters long" };
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { 
                password: hashedPassword,
                mustChangePassword: false 
            }
        });

        // Try to update token/session via NextAuth update if possible, but mostly handled by reloading page and redirecting in middleware
        // Revalidate layouts
        revalidatePath('/', 'layout');

        return { success: true, message: 'Password updated successfully. Redirecting...' };
    } catch (error) {
        console.error("Failed to update password:", error);
        return { message: "Failed to update password. Please try again." };
    }
}

export async function suspendUser(userId: string, currentStatus: boolean) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: !currentStatus },
        });

        await prisma.systemActionLog.create({
            data: {
                action: !currentStatus ? 'RESTORE' : 'SUSPEND',
                entityType: 'USER',
                entityId: userId,
                details: `User account was ${!currentStatus ? 'restored' : 'suspended'}`,
                performedById: session.user.id
            }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update user status' };
    }
}

export async function toggleUserNotifications(userId: string, currentStatus: boolean) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { notificationsEnabled: !currentStatus },
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update notification status' };
    }
}

export async function toggleUserReportAccess(userId: string, currentStatus: boolean) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { canViewReports: !currentStatus },
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to update report access status' };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' };
    if (session?.user?.id === userId) return { success: false, error: 'Cannot delete your own account.' };

    try {
        await prisma.user.delete({
            where: { id: userId },
        });

        await prisma.systemActionLog.create({
            data: {
                action: 'DELETE',
                entityType: 'USER',
                entityId: userId,
                details: `User account was permanently deleted`,
                performedById: session.user.id
            }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2003') {
            return { success: false, error: 'Cannot delete user: They are tied to existing records (bugs, projects, etc).' };
        }
        return { success: false, error: 'Cannot delete user.' };
    }
}

export async function resetUserPassword(userId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' };

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return { success: false, error: 'User not found' };

        // Generate a random 8-character password
        const newPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { 
                password: hashedPassword,
                mustChangePassword: true
            }
        });

        // Try to send email if SMTP is configured
        const settings = await prisma.smtpSettings.findFirst();
        if (settings && targetUser.email) {
            try {
                // Use the centralized sendMail utility to ensure standard templates and logging
                const { sendMail } = await import('../mail');
                await sendMail({
                    to: targetUser.email,
                    subject: "Your Password Has Been Reset",
                    html: `<b>Hello ${targetUser.name},</b><br/><br/>An admin has manually reset your password. Here is your new temporary login password:<br/><br/><strong>${newPassword}</strong><br/><br/>Please login and change your password immediately.`,
                });
            } catch (emailErr: any) {
                console.error("Failed to email new password:", emailErr);
                return { success: true, message: `Password reset to: ${newPassword} (Email failed to send). Please copy it.` };
            }
        } else {
            return { success: true, message: `Password reset to: ${newPassword} (No SMTP Configured). Please copy it.` };
        }

        return { success: true, message: `Password reset successfully. Email sent to user.` };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to reset password.' };
    }
}

export async function forgotPassword(email: string) {
    try {
        const targetUser = await prisma.user.findUnique({ where: { email } });
        if (!targetUser) {
            // Do not reveal if the email exists or not to unauthenticated users, just return success
            return { success: true, message: 'If the email exists, a temporary password has been sent.' };
        }

        const newPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: targetUser.id },
            data: { 
                password: hashedPassword,
                mustChangePassword: true
            }
        });

        const settings = await prisma.smtpSettings.findFirst();
        if (settings) {
            try {
                // Use the centralized sendMail utility
                const { sendMail } = await import('../mail');
                await sendMail({
                    to: targetUser.email,
                    subject: "Temporary Password Created",
                    html: `<b>Hello ${targetUser.name},</b><br/><br/>You requested a password reset. Here is your new temporary login password:<br/><br/><strong>${newPassword}</strong><br/><br/>Please login and change your password immediately.`,
                });
            } catch (emailErr: any) {
                console.error("Failed to email temporary password:", emailErr);
            }
        }

        return { success: true, message: 'If the email exists, a temporary password has been sent.' };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to process request.' };
    }
}

const EditUserSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().optional(),
    role: z.enum(["ADMIN", "PROJECT_MANAGER", "DEVELOPER", "TESTER"]),
});

export async function editUser(prevState: any, formData: FormData) {
    const validatedFields = EditUserSchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password') || undefined,
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update User.',
        };
    }

    const { id, name, email, password, role } = validatedFields.data;

    const session = await auth();
    const currentUserRole = session?.user?.role;
    if (currentUserRole === 'PROJECT_MANAGER' && role === 'ADMIN') {
        return { message: 'Unauthorized: Project Managers cannot grant Admin privileges.' };
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== id) {
            return { message: 'Email already exists for another user.' };
        }

        const data: any = { name, email, role: role as Role };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data,
        });

        if (session?.user?.id) {
            await prisma.systemActionLog.create({
                data: {
                    action: 'UPDATE',
                    entityType: 'USER',
                    entityId: id,
                    details: `Updated user profile/role for ${data.email || 'user'}`,
                    performedById: session.user.id
                }
            });
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'User updated successfully.' };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to Update User.' };
    }
}

export async function uploadAvatar(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const file = formData.get('avatar') as File | null;
    if (!file || file.size === 0) {
        return { error: "No file provided" };
    }

    if (!file.type.startsWith('image/')) {
        return { error: "File must be an image" };
    }

    if (file.size > 5 * 1024 * 1024) {
        return { error: "File size must be less than 5MB" };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split('.').pop();
        const fileName = `avatar-${session.user.id}-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const avatarUrl = `/uploads/avatars/${fileName}`;

        await prisma.user.update({
            where: { id: session.user.id },
            data: { avatarUrl }
        });

        revalidatePath('/', 'layout'); // Revalidate entire app to show new avatar everywhere
        return { success: true, avatarUrl };
    } catch (e) {
        console.error("Failed to upload avatar", e);
        return { error: "Failed to upload avatar" };
    }
}

