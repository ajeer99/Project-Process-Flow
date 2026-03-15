'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/prisma';

const BuildSchema = z.object({
    id: z.string(),
    version: z.string().min(1, "Build version is required"),
    releaseNotes: z.string().nullable(),
    projectId: z.string().min(1, "Project selection is required"),
});
const CreateBuildSchema = BuildSchema.omit({ id: true });
export async function createBuild(prevState: any, formData: FormData) {
    const validatedFields = CreateBuildSchema.safeParse({
        version: formData.get('version'),
        releaseNotes: formData.get('releaseNotes') || null,
        projectId: formData.get('projectId'),
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Build.',
        };
    }
    const { version, releaseNotes, projectId } = validatedFields.data;
    try {
        await prisma.build.create({
            data: {
                version,
                releaseNotes,
                projectId,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Build.',
        };
    }
    revalidatePath('/admin/builds');
    redirect('/admin/builds');
}
export async function deleteBuild(id: string) {
    try {
        await prisma.build.delete({
            where: { id },
        });
        revalidatePath('/admin/builds');
        return { message: 'Deleted Build.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Build.' };
    }
}
