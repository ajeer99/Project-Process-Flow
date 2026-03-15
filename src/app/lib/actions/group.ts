'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';

export async function createGroup(prevState: any, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'PROJECT_MANAGER') {
        return { message: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const type = (formData.get('type') as any) || 'DEVELOPER';
    const userIds = formData.getAll('userIds') as string[]; // Can be empty

    if (!name) {
        return { message: 'Group name is required.' };
    }

    const existingGroup = await prisma.group.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existingGroup) {
        return { message: 'A group with this name already exists.' };
    }

    try {
        const newGroup = await prisma.group.create({
            data: {
                name,
                description,
                type,
                users: {
                    connect: userIds.map(id => ({ id }))
                }
            },
            include: { users: { select: { name: true, email: true } } }
        });

        const settings = await prisma.smtpSettings.findFirst();
        if (settings && newGroup.users.length > 0) {
            try {
                const { sendMail } = await import('../mail');
                for (const user of newGroup.users) {
                    await sendMail({
                        to: user.email,
                        subject: `Added to Group: ${newGroup.name}`,
                        html: `<b>Hello ${user.name},</b><br/><br/>You have been assigned to the <strong>${newGroup.name}</strong> group.<br/><br/>You may receive bug assignments associated with this group's discipline.`,
                    }).catch(console.error); // Do not crash the loop if one fails
                }
            } catch (emailErr) {
                console.error("Failed to trigger group assignment emails:", emailErr);
            }
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'Group created successfully.' };
    } catch (e) {
        console.error("Group creation failed:", e);
        return { message: 'Failed to create group.' };
    }
}

export async function updateGroup(groupId: string, data: { name?: string; description?: string; type?: any; userIds?: string[] }) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'PROJECT_MANAGER') {
        return { error: 'Unauthorized' };
    }

    try {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type) updateData.type = data.type;
        
        let newlyAddedUserIds: string[] = [];
        if (data.userIds) {
            const currentGroup = await prisma.group.findUnique({
                where: { id: groupId },
                include: { users: { select: { id: true } } }
            });
            const currentUserIds = currentGroup?.users.map(u => u.id) || [];
            newlyAddedUserIds = data.userIds.filter(id => !currentUserIds.includes(id));

            updateData.users = {
                set: data.userIds.map(id => ({ id }))
            };
        }

        const updatedGroup = await prisma.group.update({
            where: { id: groupId },
            data: updateData
        });

        const settings = await prisma.smtpSettings.findFirst();
        if (settings && newlyAddedUserIds.length > 0) {
            try {
                const newUsers = await prisma.user.findMany({
                    where: { id: { in: newlyAddedUserIds } },
                    select: { name: true, email: true }
                });
                const { sendMail } = await import('../mail');
                for (const user of newUsers) {
                    await sendMail({
                        to: user.email,
                        subject: `Added to Group: ${updatedGroup.name}`,
                        html: `<b>Hello ${user.name},</b><br/><br/>You have been assigned to the <strong>${updatedGroup.name}</strong> group.<br/><br/>You may receive bug assignments associated with this group's discipline.`,
                    }).catch(console.error);
                }
            } catch (emailErr) {
                console.error("Failed to trigger group update assignment emails:", emailErr);
            }
        }

        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        console.error("Updating group failed", e);
        return { error: 'Failed to update group.' };
    }
}

export async function deleteGroup(groupId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') { // maybe only Admin can delete? Or PM too? Let's say Admin and PM.
        return { error: 'Unauthorized' };
    }

    try {
        // Check if group is associated with any bugs or assignment flows
        const groupRefs = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                _count: {
                    select: {
                        bugsAssignedToDeveloper: true,
                        bugsAssignedToTester: true,
                        developerFlows: true,
                        testerFlows: true
                    }
                }
            }
        });

        if (groupRefs) {
            const sum = groupRefs._count.bugsAssignedToDeveloper + 
                        groupRefs._count.bugsAssignedToTester + 
                        groupRefs._count.developerFlows + 
                        groupRefs._count.testerFlows;
            
            if (sum > 0) {
                return { error: 'Cannot delete group because it is still assigned to bugs or project flows.' };
            }
        }

        await prisma.group.delete({
            where: { id: groupId }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        console.error("Deleting group failed", e);
        return { error: 'Failed to delete group.' };
    }
}
