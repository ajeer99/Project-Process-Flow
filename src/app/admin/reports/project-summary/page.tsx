import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportActions } from '@/components/reports/ReportActions';
import { BugIcon, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Status, User } from '@prisma/client';

export default async function ProjectSummaryReport({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string, startDate?: string, endDate?: string, status?: string, assigneeId?: string }>
}) {
    const session = await auth();
    if (!session?.user) return null;

    const resolvedSearchParams = await searchParams;

    // 1. Fetch Projects for the Filter Dropdown
    let projectsQuery: any = {};
    if (session.user.role === 'PROJECT_MANAGER') {
        projectsQuery = { managerId: session.user.id };
    }
    const projects = await prisma.project.findMany({
        where: projectsQuery,
        select: { id: true, name: true, startDate: true, endDate: true },
        orderBy: { name: 'asc' }
    });

    // 1b. Fetch Users for the Assignee Filter
    let usersQuery: any = { role: { in: ['DEVELOPER', 'TESTER'] } };
    if (session.user.role === 'PROJECT_MANAGER') {
        const projectIds = projects.map(p => p.id);
        const bugsInProj = await prisma.bug.findMany({ where: { projectId: { in: projectIds } }, select: { developerId: true, testerId: true } });
        const userIds = new Set<string>();
        bugsInProj.forEach(b => {
             if (b.developerId) userIds.add(b.developerId);
             if (b.testerId) userIds.add(b.testerId);
        });
        usersQuery.id = { in: Array.from(userIds) };
    }
    const assignees = await prisma.user.findMany({
        where: usersQuery,
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' }
    });

    // 2. Build Bug Query based on filters and role
    const bugWhere: any = {};
    
    // Project Filter
    if (resolvedSearchParams.projectId && resolvedSearchParams.projectId !== 'all') {
        bugWhere.projectId = resolvedSearchParams.projectId;
        // Security check: If PM, ensure they own this project
        if (session.user.role === 'PROJECT_MANAGER') {
            const owns = projects.find(p => p.id === resolvedSearchParams.projectId);
            if (!owns) return <div className="p-8 text-center text-red-500">Unauthorized Project Access</div>;
        }
    } else if (session.user.role === 'PROJECT_MANAGER') {
        bugWhere.projectId = { in: projects.map(p => p.id) };
    }

    // Date Filters
    if (resolvedSearchParams.startDate || resolvedSearchParams.endDate) {
        bugWhere.createdAt = {};
        if (resolvedSearchParams.startDate) bugWhere.createdAt.gte = new Date(resolvedSearchParams.startDate);
        if (resolvedSearchParams.endDate) bugWhere.createdAt.lte = new Date(resolvedSearchParams.endDate + 'T23:59:59.999Z');
    }

    // Custom Filters
    if (resolvedSearchParams.status && resolvedSearchParams.status !== 'all') {
        bugWhere.status = resolvedSearchParams.status;
    }

    if (resolvedSearchParams.assigneeId && resolvedSearchParams.assigneeId !== 'all') {
        bugWhere.OR = [
            { developerId: resolvedSearchParams.assigneeId },
            { testerId: resolvedSearchParams.assigneeId }
        ];
    }

    // 3. Fetch Bugs
    const bugs = await prisma.bug.findMany({
        where: bugWhere,
        include: {
            project: { select: { name: true } },
            developer: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // 4. Calculate Metrics
    const totalBugs = bugs.length;
    let fixedBugs = 0;
    let openBugs = 0;
    let criticalBugs = 0;
    let totalTimeSpent = 0; // in minutes

    const statusCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    const blockers: any[] = [];

    bugs.forEach(bug => {
        // Status counts
        statusCounts[bug.status] = (statusCounts[bug.status] || 0) + 1;
        if (bug.status === 'FIXED' || bug.status === 'VERIFIED') fixedBugs++;
        if (bug.status === 'OPEN' || bug.status === 'IN_PROGRESS') openBugs++;

        // Severity counts
        severityCounts[bug.severity] = (severityCounts[bug.severity] || 0) + 1;
        if (bug.severity === 'CRITICAL') criticalBugs++;

        // Time spent - dynamically includes currently tracking duration
        let liveTime = (bug.timeSpent || 0) + (bug.pmTimeSpent || 0) + (bug.devTimeSpent || 0) + (bug.testerTimeSpent || 0);
        if (bug.assignedAt && !['FIXED', 'VERIFIED', 'CLOSED'].includes(bug.status)) {
            const diffMins = Math.floor((new Date().getTime() - new Date(bug.assignedAt).getTime()) / 60000);
            liveTime += Math.max(0, diffMins);
        }
        totalTimeSpent += liveTime;
        (bug as any).liveTimeSpent = liveTime;

        // Blockers (Critical severity that are not resolved)
        if (bug.severity === 'CRITICAL' && (bug.status === 'OPEN' || bug.status === 'IN_PROGRESS')) {
            blockers.push(bug);
        }
    });

    const progressPercentage = totalBugs === 0 ? 0 : Math.round((fixedBugs / totalBugs) * 100);

    // Export Data Prep
    const exportColumns = [
        { header: 'Bug ID', key: 'id' },
        { header: 'Title', key: 'title' },
        { header: 'Project', key: 'projectName' },
        { header: 'Status', key: 'status' },
        { header: 'Severity', key: 'severity' },
        { header: 'Time Spent (Mins)', key: 'timeSpent' },
        { header: 'Created', key: 'createdAt' }
    ];
    const exportData = bugs.map(b => ({
        id: b.id,
        title: b.title,
        projectName: b.project.name,
        status: b.status,
        severity: b.severity,
        timeSpent: (b as any).liveTimeSpent || ((b.timeSpent || 0) + (b.pmTimeSpent || 0) + (b.devTimeSpent || 0) + (b.testerTimeSpent || 0)),
        createdAt: b.createdAt.toISOString().split('T')[0]
    }));

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Project Summary</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">High-level overview of project health and bug statistics.</p>
                </div>
                <div className="print:hidden">
                    <ReportActions data={exportData} filename="project-summary-report" columns={exportColumns} />
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
                            id: 'assigneeId',
                            label: 'Assignee',
                            options: assignees.map(a => ({ value: a.id, label: `${a.name} (${a.role.substring(0,3)})` }))
                        }
                    ]}
                />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Bugs</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalBugs}</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <BugIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolution Progress</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{progressPercentage}%</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Critical Issues</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{criticalBugs}</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Time Spent</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{Math.round(totalTimeSpent / 60)} <span className="text-lg text-slate-500 font-normal">hrs</span></p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Breakdowns & Blockers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Status & Severity Tables */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-semibold text-slate-800 dark:text-white">Bugs by Status</h3>
                        </div>
                        <div className="p-6">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between mb-2 last:mb-0">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{status.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{count}</span>
                                </div>
                            ))}
                            {Object.keys(statusCounts).length === 0 && <p className="text-sm text-slate-500 text-center">No data available.</p>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-semibold text-slate-800 dark:text-white">Bugs by Severity</h3>
                        </div>
                        <div className="p-6">
                            {Object.entries(severityCounts).map(([severity, count]) => (
                                <div key={severity} className="flex items-center justify-between mb-2 last:mb-0">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{severity}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{count}</span>
                                </div>
                            ))}
                            {Object.keys(severityCounts).length === 0 && <p className="text-sm text-slate-500 text-center">No data available.</p>}
                        </div>
                    </div>
                </div>

                {/* Pending Blockers */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-red-50/50 dark:bg-red-500/5 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-slate-800 dark:text-white">Pending Blockers</h3>
                        <span className="ml-auto text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">{blockers.length}</span>
                    </div>
                    <div className="p-0">
                        {blockers.length > 0 ? (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                {blockers.map(bug => (
                                    <li key={bug.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <Link href={`/admin/bugs/${bug.id}`} className="block">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1 line-clamp-1">{bug.title}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                <span>{bug.project.name}</span>
                                                <span>•</span>
                                                <span className="text-red-500 font-medium">{bug.status}</span>
                                                {bug.developer && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Assigned to {bug.developer.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center">
                                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-50" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">No critical blockers currently open.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
