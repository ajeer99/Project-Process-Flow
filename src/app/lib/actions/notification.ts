'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import prisma from '@/app/lib/prisma';
import { chatEmitter } from '@/app/lib/eventEmitter';

export async function getUnreadNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                isRead: false
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });
        return notifications;
    } catch (e) {
        console.error("Failed to fetch unread notifications", e);
        return [];
    }
}

export async function getAllNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return notifications;
    } catch (e) {
        console.error("Failed to fetch all notifications", e);
        return [];
    }
}

export async function markNotificationAsRead(id: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    try {
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        revalidatePath('/', 'layout');
    } catch (e) {
        console.error("Failed to mark notification as read", e);
    }
}

export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.notification.updateMany({
            where: { 
                userId: session.user.id,
                isRead: false
            },
            data: { isRead: true }
        });
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e) {
        console.error("Failed to mark all notifications as read", e);
        return { success: false };
    }
}

export async function createNotification(userIds: string[], title: string, message: string, linkUrl?: string) {
    try {
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds }
            },
            select: { id: true }
        });

        if (users.length === 0) return;

        await prisma.notification.createMany({
            data: users.map(u => ({
                userId: u.id,
                title,
                message,
                linkUrl,
                isRead: false
            }))
        });

        // Emit real-time event
        for (const user of users) {
             chatEmitter.emit('notification:new', { receiverId: user.id });
        }
    } catch (e) {
        console.error("Failed to create notifications", e);
    }
}
