'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/app/lib/prisma';

export async function updateProject(id: string, name: string, description: string | null) {
    try {
        await prisma.project.update({ where: { id }, data: { name, description } });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/projects');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateModule(id: string, name: string) {
    try {
        await prisma.module.update({ where: { id }, data: { name } });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/modules');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateSubModule(id: string, name: string) {
    try {
        await prisma.subModule.update({ where: { id }, data: { name } });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/modules');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateBuild(id: string, version: string, releaseNotes: string | null) {
    try {
        await prisma.build.update({ where: { id }, data: { version, releaseNotes } });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/builds');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
