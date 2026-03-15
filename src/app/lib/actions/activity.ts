'use server';

import { auth } from '../../../../auth';
import prisma from '@/app/lib/prisma';
import { checkAndRunAutoBackup } from '../auto-backup';

export async function updateHeartbeat() {
    try {
        // Trigger auto-backup check asynchronously (fire & forget)
        checkAndRunAutoBackup().catch(console.error);

        const session = await auth();
        if (!session?.user?.id) return { success: false };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { lastActive: true, isOnline: true }
        });

        if (!user) return { success: false };

        const now = new Date();
        const timeDiffMs = now.getTime() - user.lastActive.getTime();
        
        // The client pings every 1 minute. If they were already online and the last ping
        // was less than ~2 minutes ago (to allow for slight delays), add 1 minute to total.
        const minutesToAdd = (user.isOnline && timeDiffMs > 0 && timeDiffMs < 2 * 60 * 1000) ? 1 : 0;

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                isOnline: true,
                liveSessionMinutes: { increment: minutesToAdd },
                lastActive: now,
            }
        });

        // Also proactively mark any users inactive if they haven't pinged in 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        await prisma.user.updateMany({
            where: {
                isOnline: true,
                lastActive: { lt: fiveMinutesAgo }
            },
            data: { isOnline: false }
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update heartbeat:', error);
        return { success: false };
    }
}
