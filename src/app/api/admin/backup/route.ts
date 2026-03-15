import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const type = url.searchParams.get('type') || 'full'; // 'full', 'data_only', 'config_only'

        let exportData: any = { type, timestamp: new Date(), version: '1.0' };

        if (type === 'full' || type === 'config_only') {
            exportData.appSettings = await prisma.appSettings.findMany();
            exportData.smtpSettings = await prisma.smtpSettings.findMany();
        }

        if (type === 'full' || type === 'data_only') {
            exportData.users = await prisma.user.findMany();
            exportData.groups = await prisma.group.findMany();
            exportData.projects = await prisma.project.findMany();
            exportData.modules = await prisma.module.findMany();
            exportData.subModules = await prisma.subModule.findMany();
            exportData.builds = await prisma.build.findMany();
            exportData.assignmentFlows = await prisma.assignmentFlow.findMany();
            exportData.bugs = await prisma.bug.findMany();
            exportData.comments = await prisma.comment.findMany();
        }

        const jsonString = JSON.stringify(exportData, null, 2);

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="qa_portal_export_${type}_${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error: any) {
        console.error("Backup failed", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
