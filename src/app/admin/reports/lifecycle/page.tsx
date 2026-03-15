import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportActions } from '@/components/reports/ReportActions';
import { Status, Severity } from '@prisma/client';
import Link from 'next/link';

export default async function BugLifecycleReport({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string, startDate?: string, endDate?: string, status?: string, severity?: string }>
}) {
    const session = await auth();
    if (!session?.user) return null;

    const resolvedSearchParams = await searchParams;

    // 1. Fetch Projects for the Filter Dropdown
    let projectsQuery: any = {};
    if (session.user.role === 'PROJECT_MANAGER') projectsQuery = { managerId: session.user.id };
    
    const projects = await prisma.project.findMany({
        where: projectsQuery,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    // 2. Build Bug Query
    const bugWhere: any = {};
    if (resolvedSearchParams.status && resolvedSearchParams.status !== 'all') {
        bugWhere.status = resolvedSearchParams.status;
    }
    if (resolvedSearchParams.severity && resolvedSearchParams.severity !== 'all') {
        bugWhere.severity = resolvedSearchParams.severity;
    }

    if (resolvedSearchParams.projectId && resolvedSearchParams.projectId !== 'all') {
        bugWhere.projectId = resolvedSearchParams.projectId;
    } else if (session.user.role === 'PROJECT_MANAGER') {
        bugWhere.projectId = { in: projects.map(p => p.id) };
    }

    if (resolvedSearchParams.startDate || resolvedSearchParams.endDate) {
        bugWhere.createdAt = {};
        if (resolvedSearchParams.startDate) bugWhere.createdAt.gte = new Date(resolvedSearchParams.startDate);
        if (resolvedSearchParams.endDate) bugWhere.createdAt.lte = new Date(resolvedSearchParams.endDate + 'T23:59:59.999Z');
    }

    const bugs = await (prisma.bug as any).findMany({
        where: bugWhere,
        include: {
            project: { select: { name: true } },
            developer: { select: { name: true } },
            tester: { select: { name: true } },
            developerGroup: { select: { name: true } },
            testerGroup: { select: { name: true } },
            resolvedBy: { select: { name: true } },
            verifiedBy: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Export Data Prep
    const exportColumns = [
        { header: 'Bug ID', key: 'id' },
        { header: 'Title', key: 'title' },
        { header: 'Project', key: 'projectName' },
        { header: 'Status', key: 'status' },
        { header: 'Severity', key: 'severity' },
        { header: 'Assigned Developer', key: 'devName' },
        { header: 'Assigned Tester', key: 'testerName' },
        { header: 'Time Spent (Mins)', key: 'timeSpent' },
        { header: 'Reopen Count', key: 'reopenCount' },
        { header: 'Automation Status', key: 'automationResult' },
        { header: 'Created', key: 'createdAt' },
        { header: 'Resolved At', key: 'resolvedAt' }
    ];
    const exportData = bugs.map((bugModel: any) => {
        const b = bugModel as any;
        return {
        id: b.id,
        title: b.title,
        projectName: b.project.name,
        status: b.status,
        severity: b.severity,
        devName: b.resolvedBy?.name || b.developer?.name || b.developerGroup?.name || 'Unassigned',
        testerName: b.verifiedBy?.name || b.tester?.name || b.testerGroup?.name || 'Unassigned',
        timeSpent: (() => {
            let t = (b.timeSpent || 0) + (b.pmTimeSpent || 0) + (b.devTimeSpent || 0) + (b.testerTimeSpent || 0);
            if (b.lastStatusUpdateAt && !['FIXED', 'VERIFIED', 'CLOSED'].includes(b.status)) {
                t += Math.max(0, Math.floor((new Date().getTime() - new Date(b.lastStatusUpdateAt).getTime()) / 60000));
            }
            return t;
        })(),
        reopenCount: b.reopenCount,
        automationResult: b.automationResult || 'N/A',
        createdAt: b.createdAt.toLocaleString(),
        resolvedAt: b.resolvedAt ? b.resolvedAt.toLocaleString() : 'Pending'
    };
    });

    const formatTime = (mins: number) => {
        if (!mins || mins === 0) return '0 m';
        if (mins < 1) return Math.round(mins * 60) + ' s';
        if (mins < 60) {
            const m = Math.floor(mins);
            const s = Math.round((mins - m) * 60);
            return s > 0 ? `${m}m ${s}s` : `${m} m`;
        }
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return m > 0 ? `${h}h ${m}m` : `${h} h`;
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Bug Lifecycle</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Detailed view of bug turnaround times, assignments, and test automation status.</p>
                </div>
                <div className="print:hidden">
                    <ReportActions data={exportData} filename="bug-lifecycle-report" columns={exportColumns} />
                </div>
            </div>

            <div className="print:hidden">
                <ReportFilters 
                    projects={projects} 
                    extraFilters={[
                        {
                            id: 'status',
                            label: 'Status',
                            options: Object.values(Status).map(s => ({ value: s, label: s.replace(/_/g, ' ') }))
                        },
                        {
                            id: 'severity',
                            label: 'Severity',
                            options: Object.values(Severity).map(s => ({ value: s, label: s }))
                        }
                    ]}
                />
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bug Details</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignments</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifecycle Tracking</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {bugs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No bugs found matching the current filters.
                                    </td>
                                </tr>
                            ) : (
                                bugs.map((bugModel: any) => {
                                    const bug = bugModel as any;
                                    return (
                                    <tr key={bug.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <Link href={`/admin/bugs/${bug.id}`} className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                                    {bug.title.substring(0, 40)}{bug.title.length > 40 ? '...' : ''}
                                                </Link>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex gap-2">
                                                    <span className="truncate max-w-[150px]">{bug.project.name}</span>
                                                    <span>•</span>
                                                    <span className={`font-medium ${
                                                        bug.severity === 'CRITICAL' ? 'text-red-500' :
                                                        bug.severity === 'HIGH' ? 'text-orange-500' :
                                                        bug.severity === 'MEDIUM' ? 'text-blue-500' : 'text-slate-500'
                                                    }`}>{bug.severity}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div><span className="text-slate-500">Dev:</span> <span className="text-slate-900 dark:text-white font-medium">{bug.resolvedBy?.name || bug.developer?.name || bug.developerGroup?.name || 'Unassigned'}</span></div>
                                                <div><span className="text-slate-500">Test:</span> <span className="text-slate-900 dark:text-white font-medium">{bug.verifiedBy?.name || bug.tester?.name || bug.testerGroup?.name || 'Unassigned'}</span></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div><span className="text-slate-500">Reopened:</span> <span className={`${bug.reopenCount > 0 ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-white'}`}>{bug.reopenCount} times</span></div>
                                                <div>
                                                    <span className="text-slate-500">Time Spent:</span> 
                                                    <span className="text-slate-900 dark:text-white font-medium ml-1">
                                                        {(() => {
                                                            let t = (bug.timeSpent || 0) + (bug.pmTimeSpent || 0) + (bug.devTimeSpent || 0) + (bug.testerTimeSpent || 0);
                                                            if (bug.lastStatusUpdateAt && !['FIXED', 'VERIFIED', 'CLOSED'].includes(bug.status)) {
                                                                t += Math.max(0, Math.floor((new Date().getTime() - new Date(bug.lastStatusUpdateAt).getTime()) / 60000));
                                                            }
                                                            return formatTime(t);
                                                        })()}
                                                    </span>
                                                </div>
                                                {bug.automationResult && (
                                                    <div><span className="text-slate-500">AutoTest:</span> <span className="text-indigo-600 dark:text-indigo-400 font-medium">{bug.automationResult}</span></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col gap-1">
                                                <div><span className="text-xs uppercase tracking-wider mr-1 opacity-75">Created:</span> {new Date(bug.createdAt).toLocaleDateString()}</div>
                                                <div><span className="text-xs uppercase tracking-wider mr-1 opacity-75">Resolved:</span> {bug.resolvedAt ? new Date(bug.resolvedAt).toLocaleDateString() : 'Pending'}</div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
