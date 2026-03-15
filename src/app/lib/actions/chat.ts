'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../../auth';
import prisma from '@/app/lib/prisma';
import { chatEmitter } from '@/app/lib/eventEmitter';

export async function sendMessage(receiverId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!content.trim()) return { error: "Message cannot be empty." };

    try {
        const message = await prisma.directMessage.create({
            data: {
                content,
                senderId: session.user.id,
                receiverId
            },
            include: { sender: { select: { name: true, email: true, avatarUrl: true } } }
        });
        
        // Immediately notify the recipient via Event Bus for SSE streams
        chatEmitter.emit('chat:message', message);
        
        revalidatePath('/admin/chat');
        return { success: true, message };
    } catch (e) {
        console.error("Failed to send message", e);
        return { error: "Failed to send message" };
    }
}

export async function getChatUsers() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const users = await prisma.user.findMany({
            where: { id: { not: session.user.id }, isActive: true },
            select: { id: true, name: true, email: true, presence: true, isOnline: true, avatarUrl: true },
            orderBy: { name: 'asc' }
        });

        // Get unread counts per sender
        const unreadCounts = await prisma.directMessage.groupBy({
            by: ['senderId'],
            where: { receiverId: session.user.id, isRead: false },
            _count: { id: true }
        });

        const usersWithUnread = users.map(u => {
            const unread = unreadCounts.find(uc => uc.senderId === u.id)?._count.id || 0;
            return { ...u, unreadCount: unread };
        });

        return { success: true, users: usersWithUnread };
    } catch (e) {
        console.error("Failed to fetch users", e);
        return { error: "Failed to fetch users" };
    }
}

export async function getMessages(otherUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: session.user.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: session.user.id }
                ]
            },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { name: true, email: true, avatarUrl: true } } }
        });

        // Mark as read
        const unreadMsgIds = messages.filter(m => m.receiverId === session.user!.id && !m.isRead).map(m => m.id);
        if (unreadMsgIds.length > 0) {
            await prisma.directMessage.updateMany({
                where: { id: { in: unreadMsgIds } },
                data: { isRead: true }
            });
        }

        return { success: true, messages };
    } catch (e) {
        console.error("Failed to fetch messages", e);
        return { error: "Failed to fetch messages" };
    }
}

export async function getUnreadMessageCount() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const count = await prisma.directMessage.count({
            where: {
                receiverId: session.user.id,
                isRead: false
            }
        });
        return { success: true, count };
    } catch (e) {
        return { error: "Failed to fetch count" };
    }
}

// Lightweight Action just for SSE presence typing
export async function sendTypingIndicator(receiverId: string, isTyping: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // Find the sender data to pass down
        const sender = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, avatarUrl: true }
        });

        if (sender) {
            chatEmitter.emit('chat:typing', {
                senderId: sender.id,
                senderName: sender.name,
                senderAvatar: sender.avatarUrl,
                receiverId,
                isTyping
            });
        }
        return { success: true };
    } catch (e) {
        return { error: "Failed to send indicator" };
    }
}
