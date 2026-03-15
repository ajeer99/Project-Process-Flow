'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import prisma from '@/app/lib/prisma';

export async function updateUserPresence(presence: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { presence }
        });

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to update user presence", error);
        return { error: "Failed to update presence" };
    }
}
