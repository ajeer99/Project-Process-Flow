import React from 'react';
import prisma from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { ProjectReports } from '../../../project-reports';
import { BugFixedAudit } from '../../../bug-fixed-audit';
import Link from 'next/link';
import { ChevronLeft, Box } from 'lucide-react';
import { PrintReportControls } from '../../../../../components/print-report-controls';

export default async function ModuleAnalyticsPage({ params }: { params: Promise<{ id: string, moduleId: string }> }) {
    const { id, moduleId } = await params;

    const moduleData = await prisma.module.findUnique({
        where: { id: moduleId, projectId: id },
        include: {
            project: { select: { name: true } },
            bugs: {
                include: {
                    developer: true,
                    tester: true,
                    module: { select: { name: true } }
                },
                orderBy: { updatedAt: 'desc' }
            }
        }
    });

    if (!moduleData) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <Link
                    href={`/admin/projects/${id}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Project Dashboard
                </Link>
                
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Box className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{moduleData.name} Analytics</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Targeted module reporting for {moduleData.project.name}</p>
                    </div>
                </div>
            </div>

            {/* Print Controls */}
            <div className="flex justify-end mb-4">
                <PrintReportControls 
                    reportUrl={`/admin/projects/${id}/modules/${moduleId}/print/report`} 
                    auditUrl={`/admin/projects/${id}/modules/${moduleId}/print/audit`} 
                />
            </div>

            {/* Reuse the ProjectReports component but pass only the module's bugs */}
            <div className="mt-8">
                <ProjectReports bugs={moduleData.bugs} />
            </div>

            {/* Reuse the Audit Log for this module's fixed bugs */}
            <div className="mt-12">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Module Bug Activity</h3>
                    <p className="text-sm text-slate-500">Recent fixes and resolved tickets strictly within {moduleData.name}.</p>
                </div>
                <BugFixedAudit bugs={moduleData.bugs} />
            </div>
        </div>
    );
}
