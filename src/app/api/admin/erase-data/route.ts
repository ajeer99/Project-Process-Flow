import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // We use a transaction to guarantee all-or-nothing wipe
        await prisma.$transaction([
            prisma.comment.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.directMessage.deleteMany(),
            prisma.systemActionLog.deleteMany(),
            prisma.bug.deleteMany(),
            prisma.assignmentFlow.deleteMany(),
            prisma.build.deleteMany(),
            prisma.subModule.deleteMany(),
            prisma.module.deleteMany(),
            prisma.project.deleteMany()
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to erase data:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
