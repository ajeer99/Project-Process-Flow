'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/prisma';

const ModuleSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Module name is required"),
    projectId: z.string().min(1, "Project selection is required"),
});
const CreateModuleSchema = ModuleSchema.omit({ id: true });
export async function createModule(prevState: any, formData: FormData) {
    const validatedFields = CreateModuleSchema.safeParse({
        name: formData.get('name'),
        projectId: formData.get('projectId'),
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Module.',
        };
    }
    const { name, projectId } = validatedFields.data;
    try {
        await prisma.module.create({
            data: {
                name,
                projectId,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Module.',
        };
    }
    revalidatePath('/admin/modules');
    redirect('/admin/modules');
}
export async function deleteModule(id: string) {
    try {
        await prisma.module.delete({
            where: { id },
        });
        revalidatePath('/admin/modules');
        return { message: 'Deleted Module.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Module.' };
    }
}
