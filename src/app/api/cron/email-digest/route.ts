import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { sendMail } from '../../../lib/mail';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('--- STARTING BUG DIGEST CRON ---');

        // 1. Fetch Developers with Active Assignments
        const developers = await prisma.user.findMany({
            where: { role: 'DEVELOPER', isActive: true, notificationsEnabled: true },
            include: {
                bugsAssigned: {
                    where: { status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] } },
                    include: { module: { select: { project: { select: { name: true } } } } }
                }
            }
        });

        // 2. Fetch Testers with Bugs ready for retest
        const testers = await prisma.user.findMany({
            where: { role: 'TESTER', isActive: true, notificationsEnabled: true },
            include: {
                bugsReported: {
                    where: { status: 'READY_FOR_RETEST' },
                    include: { module: { select: { project: { select: { name: true } } } } }
                }
            }
        });

        // 3. Fetch Project Managers with overall stats
        const managers = await prisma.user.findMany({
            where: { role: 'PROJECT_MANAGER', isActive: true, notificationsEnabled: true },
            include: {
                managedProjects: {
                    include: {
                        bugs: {
                            where: { status: { notIn: ['FIXED', 'VERIFIED'] } }
                        }
                    }
                }
            }
        });

        let processed = { developer: 0, tester: 0, manager: 0 };

        // Process Developers
        for (const dev of developers) {
            if (dev.bugsAssigned.length > 0) {
                const bugListHtml = dev.bugsAssigned.map(b => `<li><strong>${b.module.project.name}</strong> - ${b.title} [${b.severity}]</li>`).join('');
                const html = `
                    <h2>Hello ${dev.name || 'Developer'},</h2>
                    <p>You have <strong>${dev.bugsAssigned.length}</strong> active bugs waiting for your attention:</p>
                    <ul>${bugListHtml}</ul>
                    <p>Please log into the QA Portal to review and update these issues.</p>
                `;
                const mailRes = await sendMail({ to: dev.email, subject: `Action Required: ${dev.bugsAssigned.length} Pending Bugs`, html });
                if (mailRes.success) processed.developer++;
            }
        }

        // Process Testers
        for (const tester of testers) {
            if (tester.bugsReported.length > 0) {
                const bugListHtml = tester.bugsReported.map(b => `<li><strong>${b.module.project.name}</strong> - ${b.title} [${b.severity}]</li>`).join('');
                const html = `
                    <h2>Hello ${tester.name || 'QA Tester'},</h2>
                    <p>Good news! <strong>${tester.bugsReported.length}</strong> bugs you reported are marked as <span style="color: purple;">READY_FOR_RETEST</span>:</p>
                    <ul>${bugListHtml}</ul>
                    <p>Please log in and verify these fixes.</p>
                `;
                const mailRes = await sendMail({ to: tester.email, subject: `Ready for Retest: ${tester.bugsReported.length} Bugs`, html });
                if (mailRes.success) processed.tester++;
            }
        }

        // Process Managers
        for (const pm of managers) {
            if (pm.managedProjects.length > 0) {
                let projectHtml = '';
                let totalBugs = 0;
                for (const proj of pm.managedProjects) {
                    if (proj.bugs.length > 0) {
                        projectHtml += `<li><strong>${proj.name}</strong>: ${proj.bugs.length} unresolved bugs</li>`;
                        totalBugs += proj.bugs.length;
                    }
                }

                if (totalBugs > 0) {
                    const html = `
                        <h2>Hello Project Manager ${pm.name || ''},</h2>
                        <p>Here is your current project health digest.</p>
                        <p>Across your managed projects, there are currently <strong>${totalBugs}</strong> unresolved bugs:</p>
                        <ul>${projectHtml}</ul>
                        <p>Log into your dashboard for detailed analytics.</p>
                    `;
                    const mailRes = await sendMail({ to: pm.email, subject: `QA Digest: ${totalBugs} Unresolved Bugs`, html });
                    if (mailRes.success) processed.manager++;
                }
            }
        }

        console.log('--- COMPLETED BUG DIGEST ---');
        return NextResponse.json({ success: true, processed });

    } catch (error: any) {
        console.error('Failed to run email digest:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
