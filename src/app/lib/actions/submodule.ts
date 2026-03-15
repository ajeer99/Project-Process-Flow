'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/prisma';

const SubModuleSchema = z.object({
    name: z.string().min(1, "Sub-Module name is required"),
    moduleId: z.string().min(1, "Module is required"),
});
export async function createSubModule(prevState: any, formData: FormData) {
    const validatedFields = SubModuleSchema.safeParse({
        name: formData.get('name'),
        moduleId: formData.get('moduleId'),
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Sub-Module.',
        };
    }
    const { name, moduleId } = validatedFields.data;
    try {
        await prisma.subModule.create({
            data: {
                name,
                moduleId,
            },
        });
    } catch (error) {
        return { message: 'Database Error: Failed to Create Sub-Module.' };
    }
    revalidatePath(`/admin/modules`);
    redirect(`/admin/modules`);
}
export async function deleteSubModule(id: string) {
    try {
        await prisma.subModule.delete({
            where: { id },
        });
        revalidatePath('/admin/modules');
        return { message: 'Deleted Sub-Module.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Sub-Module.' };
    }
}
