'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/prisma';
import fs from 'fs';
import path from 'path';
import { auth } from '../../../../auth';

const ProjectSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().nullable(),
    status: z.enum(["ACTIVE", "APPROVED", "ARCHIVED"]),
});
const CreateProjectSchema = ProjectSchema.extend({
    managerId: z.string().optional(),
}).omit({ id: true });
const UpdateProjectSchema = ProjectSchema;
export async function createProject(prevState: any, formData: FormData) {
    const validatedFields = CreateProjectSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description') || null,
        status: formData.get('status') || 'ACTIVE',
        managerId: formData.get('managerId') || undefined,
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Project.',
        };
    }
    const { name, description, status, managerId } = validatedFields.data;
    try {
        await prisma.project.create({
            data: {
                name,
                description,
                status,
                managerId: managerId || null,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Project.',
        };
    }
    revalidatePath('/admin/projects');
    redirect('/admin/projects');
}
export async function deleteProject(id: string) {
    try {
        await prisma.project.delete({
            where: { id },
        });
        revalidatePath('/admin/projects');
        return { message: 'Deleted Project.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Project.' };
    }
}

export async function updateProjectDetails(id: string, data: { name?: string; description?: string | null; imageUrl?: string | null; startDate?: Date | null; endDate?: Date | null; status?: string; managerId?: string | null; }) {
    const session = await auth();
    const currentUserRole = session?.user?.role;
    
    // Server-side protection
    if (currentUserRole === 'PROJECT_MANAGER' && (data.startDate !== undefined || data.endDate !== undefined || data.managerId !== undefined)) {
        // Strip restricted fields instead of failing, or just fail. Let's strip them to be safe and allow other updates like logo.
        delete data.startDate;
        delete data.endDate;
        delete data.managerId;
    }

    try {
        await prisma.project.update({
            where: { id },
            data
        });
        revalidatePath(`/admin/projects/${id}`);
        revalidatePath('/admin/projects');
        return { success: true };
    } catch (e: any) {
        console.error("Failed to update project details", e);
        return { error: 'Database Error: Failed to Update Project Details.' };
    }
}

export async function uploadProjectLogo(projectId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'PROJECT_MANAGER')) {
        return { error: "Unauthorized" };
    }

    const file = formData.get('logo') as File | null;
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
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `project-${projectId}-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const imageUrl = `/uploads/projects/${fileName}`;

        await prisma.project.update({
            where: { id: projectId },
            data: { imageUrl }
        });

        revalidatePath(`/admin/projects/${projectId}`);
        revalidatePath('/admin/projects'); 
        revalidatePath('/admin');
        
        return { success: true, imageUrl };
    } catch (e) {
        console.error("Failed to upload project logo", e);
        return { error: "Failed to upload project logo" };
    }
}

export async function requestManagerChange(projectId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'PROJECT_MANAGER') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true }
        });

        if (!project) return { success: false, error: 'Project not found' };

        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
        });

        // Send a notification to all admins
        const notifications = admins.map(admin => ({
            userId: admin.id,
            title: "Manager Change Requested",
            message: `${session.user?.name} has requested a change of Project Manager for the project "${project.name}".`,
            linkUrl: `/admin/projects/${projectId}`
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });
        }

        return { success: true };
    } catch (e) {
        console.error("Failed to request manager change", e);
        return { success: false, error: "Failed to request manager change" };
    }
}

