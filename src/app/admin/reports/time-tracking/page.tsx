import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportActions } from '@/components/reports/ReportActions';
import { Clock, Hourglass, Timer, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default async function TimeTrackingReport({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string, startDate?: string, endDate?: string, assigneeId?: string }>
}) {
    const session = await auth();
    if (!session?.user) return null;

    const resolvedSearchParams = await searchParams;

    const isManager = session.user.role === 'PROJECT_MANAGER';
    const isAdmin = session.user.role === 'ADMIN';

    // 1. Fetch Projects for the Filter Dropdown
    let projectsQuery: any = {};
    if (isManager) projectsQuery = { managerId: session.user.id };
    
    const projects = await prisma.project.findMany({
        where: projectsQuery,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    // 2. Build Bug Query
    const bugWhere: any = {};
    if (resolvedSearchParams.projectId && resolvedSearchParams.projectId !== 'all') {
        bugWhere.projectId = resolvedSearchParams.projectId;
    } else if (isManager) {
        bugWhere.projectId = { in: projects.map(p => p.id) };
    }

    if (resolvedSearchParams.startDate || resolvedSearchParams.endDate) {
        bugWhere.createdAt = {};
        if (resolvedSearchParams.startDate) bugWhere.createdAt.gte = new Date(resolvedSearchParams.startDate);
        if (resolvedSearchParams.endDate) bugWhere.createdAt.lte = new Date(resolvedSearchParams.endDate + 'T23:59:59.999Z');
    }
    
    // Assignee and Role constraints
    const roleConstraint = (!isAdmin && !isManager) ? {
        OR: [
            { developerId: session.user.id },
            { testerId: session.user.id }
        ]
    } : null;

    const assigneeConstraint = (resolvedSearchParams.assigneeId && resolvedSearchParams.assigneeId !== 'all') ? {
        OR: [
            { developerId: resolvedSearchParams.assigneeId },
            { testerId: resolvedSearchParams.assigneeId }
        ]
    } : null;

    if (roleConstraint && assigneeConstraint) {
        bugWhere.AND = [roleConstraint, assigneeConstraint];
    } else if (roleConstraint) {
        bugWhere.OR = roleConstraint.OR;
    } else if (assigneeConstraint) {
        bugWhere.OR = assigneeConstraint.OR;
    }

    // 3. Fetch Data
    const bugs = await (prisma.bug as any).findMany({
        where: bugWhere,
        include: {
            developer: { select: { name: true } },
            tester: { select: { name: true } },
            developerGroup: { select: { name: true } },
            testerGroup: { select: { name: true } },
            creator: { select: { name: true } },
            resolvedBy: { select: { name: true } },
            verifiedBy: { select: { name: true } },
            project: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 500 // Cap to prevent massive render loads on full history
    });

    // 4. Calculate Time Metrics from Exact Buckets
    let totalAdminLogged = 0;
    let totalPmLogged = 0;
    let totalDevLogged = 0;
    let totalTesterLogged = 0;
    let grandTotalLogged = 0;

    const timeEntries = bugs.map((b: any) => {
        const bug = b;
        const pmTime = bug.pmTimeSpent || 0;
        const devTime = bug.devTimeSpent || 0;
        const testerTime = bug.testerTimeSpent || 0;
        const adminTime = bug.timeSpent || 0; // Legacy or explicit manual general logs
        
        const rowTotal = pmTime + devTime + testerTime + adminTime;

        totalAdminLogged += adminTime;
        totalPmLogged += pmTime;
        totalDevLogged += devTime;
        totalTesterLogged += testerTime;
        grandTotalLogged += rowTotal;

        const pmName = bug.creator?.name || 'System/Unassigned';
        const devName = bug.resolvedBy?.name || bug.developer?.name || bug.developerGroup?.name || 'Unassigned';
        const testerName = bug.verifiedBy?.name || bug.tester?.name || bug.testerGroup?.name || 'Unassigned';

        return {
            id: bug.id,
            title: bug.title,
            project: bug.project.name,
            createdAt: new Date(bug.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
            status: bug.status,
            adminTime,
            pmTime,
            devTime,
            testerTime,
            rowTotal,
            pmName,
            devName,
            testerName
        };
    });

    // Format helpers
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

    // Export Data Prep
    const exportColumns = [
        { header: 'Bug ID', key: 'id' },
        { header: 'Title', key: 'title' },
        { header: 'Project', key: 'project' },
        { header: 'Date Logged', key: 'createdAt' },
        { header: 'Status', key: 'status' },
        { header: 'Admin/Legacy Time (Mins)', key: 'adminTime' },
        { header: 'PM Name', key: 'pmName' },
        { header: 'PM Time (Mins)', key: 'pmTime' },
        { header: 'Dev Name', key: 'devName' },
        { header: 'Developer Time (Mins)', key: 'devTime' },
        { header: 'Tester Name', key: 'testerName' },
        { header: 'Tester Time (Mins)', key: 'testerTime' },
        { header: 'Total Time (Mins)', key: 'rowTotal' },
    ];
    
    const assigneesFilter = {
        id: 'assigneeId',
        label: 'Team Member',
        options: allUsers.map(u => ({ value: u.id, label: u.name }))
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Time Tracking</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analysis of active working time versus idle/waiting queues.</p>
                </div>
                <div className="print:hidden">
                    <ReportActions data={timeEntries} filename="time-tracking-report" columns={exportColumns} />
                </div>
            </div>

            <div className="print:hidden">
                <ReportFilters projects={projects} extraFilters={[assigneesFilter]} />
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-blue-600 dark:text-blue-400">Total Dev Time</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatTime(totalDevLogged)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-green-600 dark:text-green-400">Total Tester Time</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatTime(totalTesterLogged)}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                        <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-amber-600 dark:text-amber-400">Total PM Time</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatTime(totalPmLogged)}</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                        <Timer className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-indigo-600 dark:text-indigo-400">Grand Total Output</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatTime(grandTotalLogged)}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                        <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
            </div>

            {/* Granular Tracking Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800 dark:text-white">Recent Time Entries</h3>
                    <span className="text-xs text-slate-500 ml-2">(Showing latest {timeEntries.length})</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/10">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bug / Project</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Logged</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admin/Other Time</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PM Time</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dev Time</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tester Time</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {timeEntries.map((entry: any) => (
                                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Link href={`/admin/bugs/${entry.id}`} className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                                {entry.title.substring(0, 40)}{entry.title.length > 40 ? '...' : ''}
                                            </Link>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {entry.project} • <span className="text-blue-500">{entry.status}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                        {entry.createdAt}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                        <div className="flex flex-col items-center">
                                            {entry.adminTime > 0 && <span className="text-[10px] text-slate-400 uppercase">System/Admin</span>}
                                            <span className="text-slate-500 font-medium">{formatTime(entry.adminTime)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                        <div className="flex flex-col items-center">
                                            {entry.pmTime > 0 && <span className="text-xs text-slate-500 mb-0.5" title="Reporter/PM">{entry.pmName}</span>}
                                            <span className="text-amber-600 font-medium">{formatTime(entry.pmTime)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                        <div className="flex flex-col items-center">
                                            {entry.devTime > 0 && <span className="text-xs text-slate-500 mb-0.5" title="Developer">{entry.devName}</span>}
                                            <span className="text-blue-600 font-medium">{formatTime(entry.devTime)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                        <div className="flex flex-col items-center">
                                            {entry.testerTime > 0 && <span className="text-xs text-slate-500 mb-0.5" title="Tester">{entry.testerName}</span>}
                                            <span className="text-green-600 font-medium">{formatTime(entry.testerTime)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">{formatTime(entry.rowTotal)}</span>
                                    </td>
                                </tr>
                            ))}
                            {timeEntries.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No time tracking data available for this criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
