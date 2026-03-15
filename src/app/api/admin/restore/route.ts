import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

        const text = await file.text();
        const data = JSON.parse(text);

        await prisma.$transaction(async (tx) => {
            // Restore Settings
            if (data.appSettings && data.appSettings.length > 0) {
                await tx.appSettings.deleteMany();
                await tx.appSettings.createMany({ data: data.appSettings });
            }
            if (data.smtpSettings && data.smtpSettings.length > 0) {
                await tx.smtpSettings.deleteMany();
                await tx.smtpSettings.createMany({ data: data.smtpSettings });
            }

            // Restore Data
            if (data.type === 'full' || data.type === 'data_only') {
                // Wipe relational data from bottom to top
                await tx.comment.deleteMany();
                await tx.bug.deleteMany();
                await tx.assignmentFlow.deleteMany();
                await tx.build.deleteMany();
                await tx.subModule.deleteMany();
                await tx.module.deleteMany();
                await tx.project.deleteMany();

                // UPSERT Users safely without deleting the current admin
                if (data.users) {
                    for (const u of data.users) {
                        await tx.user.upsert({
                            where: { id: u.id },
                            update: { ...u, role: u.role as any },
                            create: { ...u, role: u.role as any }
                        });
                    }
                }
                
                // UPSERT Groups safely
                if (data.groups) {
                     for (const g of data.groups) {
                         await tx.group.upsert({
                             where: { id: g.id },
                             update: { ...g, type: g.type as any },
                             create: { ...g, type: g.type as any }
                         });
                     }
                }

                // Create relational data from top to bottom
                if (data.projects) await tx.project.createMany({ data: data.projects });
                if (data.modules) await tx.module.createMany({ data: data.modules });
                if (data.subModules) await tx.subModule.createMany({ data: data.subModules });
                if (data.builds) await tx.build.createMany({ data: data.builds });
                if (data.assignmentFlows) await tx.assignmentFlow.createMany({ data: data.assignmentFlows });
                
                // For bugs, enums need type coercion or just pass raw data
                if (data.bugs) {
                    const mappedBugs = data.bugs.map((b: any) => ({
                        ...b,
                        severity: b.severity as any,
                        status: b.status as any
                    }));
                    await tx.bug.createMany({ data: mappedBugs });
                }

                if (data.comments) await tx.comment.createMany({ data: data.comments });
            }
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Restore failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
