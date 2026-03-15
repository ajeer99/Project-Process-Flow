import prisma from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { ProjectHeader } from './project-header';
import { ProjectReports } from './project-reports';
import { BugFixedAudit } from './bug-fixed-audit';
import { ConfigAutoAssignment } from './config-auto-assignment';
import { auth } from '../../../../../auth';
import { PrintReportControls } from '../../components/print-report-controls';
import { Role } from '@prisma/client';

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id: id },
        include: {
            bugs: {
                include: {
                    developer: true,
                    tester: true,
                    developerGroup: true,
                    testerGroup: true,
                    module: { select: { name: true } }
                },
                orderBy: { updatedAt: 'desc' }
            },
            _count: {
                select: { modules: true, builds: true }
            },
            assignmentFlow: {
                include: {
                    developer: true,
                    developerGroup: true,
                    tester: true,
                    testerGroup: true
                }
            }
        }
    });

    const session = await auth();
    const userRole = (session?.user as any)?.role as string;
    const userId = session?.user?.id;
    const projectManagerId = (project as any)?.managerId;
    const canEditAssignmentFlow = userRole === 'ADMIN' || (userRole === 'PROJECT_MANAGER' && projectManagerId === userId);

    const [managers, developers, testers, groups] = await Promise.all([
        prisma.user.findMany({ where: { role: 'PROJECT_MANAGER' as any }, select: { id: true, name: true, email: true } }),
        prisma.user.findMany({ where: { role: 'DEVELOPER' as any }, select: { id: true, name: true, email: true } }),
        prisma.user.findMany({ where: { role: 'TESTER' as any }, select: { id: true, name: true, email: true } }),
        prisma.group.findMany({ select: { id: true, name: true, type: true } })
    ]);

    if (!project) {
        notFound();
    }

    if (project.status === 'ARCHIVED' && userRole !== 'ADMIN') {
        notFound();
    }

    return (
        <div className="space-y-6">
            <ProjectHeader project={project} managers={managers} currentUserRole={userRole} />

            <div className="flex justify-end">
                <PrintReportControls 
                    reportUrl={`/admin/projects/${project.id}/print/report`} 
                    auditUrl={`/admin/projects/${project.id}/print/audit`} 
                />
            </div>
            
            <div className="mt-8">
                <ConfigAutoAssignment 
                    projectId={project.id} 
                    currentFlow={project.assignmentFlow} 
                    developers={developers} 
                    testers={testers} 
                    groups={groups}
                    canEdit={canEditAssignmentFlow} 
                />
            </div>
            
            <div className="mt-8">
                <ProjectReports bugs={project.bugs} />
            </div>

            <div className="mt-8">
                <BugFixedAudit bugs={project.bugs} />
            </div>
        </div>
    );
}
