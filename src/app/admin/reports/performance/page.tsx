import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportActions } from '@/components/reports/ReportActions';
import { Users, Target, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

export default async function PerformanceReport({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string, startDate?: string, endDate?: string, assigneeId?: string }>
}) {
    const session = await auth();
    if (!session?.user) return null;

    const resolvedSearchParams = await searchParams;

    const isManager = session.user.role === 'PROJECT_MANAGER';
    const isDevOrTester = session.user.role === 'DEVELOPER' || session.user.role === 'TESTER';

    // 1. Fetch Projects for the Filter Dropdown
    let projectsQuery: any = {};
    if (isManager) projectsQuery = { managerId: session.user.id };
    
    const projects = await prisma.project.findMany({
        where: projectsQuery,
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
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

    if (resolvedSearchParams.assigneeId && resolvedSearchParams.assigneeId !== 'all') {
        bugWhere.OR = [
            { developerId: resolvedSearchParams.assigneeId },
            { testerId: resolvedSearchParams.assigneeId },
            { creatorId: resolvedSearchParams.assigneeId },
            { resolvedById: resolvedSearchParams.assigneeId },
            { verifiedById: resolvedSearchParams.assigneeId }
        ];
    }

    // No personal filter here, as a PM might want to see who actually fixed a bug,
    // and a Dev might want to see if their PM reported it. We rely on the metrics loop to filter properly.

    const bugs = await (prisma.bug as any).findMany({
        where: bugWhere,
        include: {
            developer: { select: { id: true, name: true, role: true } }, // Legacy fallback
            tester: { select: { id: true, name: true, role: true } },    // Legacy fallback
            creator: { select: { id: true, name: true, role: true } },
            resolvedBy: { select: { id: true, name: true, role: true } },
            verifiedBy: { select: { id: true, name: true, role: true } },
            project: { select: { name: true, endDate: true } }
        }
    });

    // 4. Calculate Performance Metrics Based on Actions
    type UserMetric = { 
        id: string, name: string, role: string, 
        assigned: number, resolved: number, invalid: number, reopened: number, totalTime: number, 
        overdue: number 
    };
    
    const reporterMetrics: Record<string, UserMetric> = {};
    const devMetricsMap: Record<string, UserMetric> = {};
    const testerMetricsMap: Record<string, UserMetric> = {};

    const initMetric = (map: Record<string, UserMetric>, u: { id: string, name: string, role: string }) => {
        if (!map[u.id]) {
            map[u.id] = { id: u.id, name: u.name, role: u.role, assigned: 0, resolved: 0, invalid: 0, reopened: 0, totalTime: 0, overdue: 0 };
        }
    };

    allUsers.forEach((u: any) => {
        if (['PROJECT_MANAGER', 'ADMIN'].includes(u.role)) initMetric(reporterMetrics, u);
        if (u.role === 'DEVELOPER') initMetric(devMetricsMap, u);
        if (u.role === 'TESTER') initMetric(testerMetricsMap, u);
    });

    let totalOverdueProjectsBugs = 0; // For PMs

    bugs.forEach((b: any) => {
        const bug = b as any;
        // Track Reporter (PMs/Admins usually)
        if (bug.creator) {
            initMetric(reporterMetrics, bug.creator);
            reporterMetrics[bug.creator.id].assigned++; // "Reported"
            if (['VERIFIED', 'CLOSED'].includes(bug.status)) reporterMetrics[bug.creator.id].resolved++; // "Successfully Fixed"
            if (bug.isInvalid) reporterMetrics[bug.creator.id].invalid++;
            reporterMetrics[bug.creator.id].totalTime += (bug.pmTimeSpent || 0);
        }

        // Track Developer Action (Fallback to assigned developer if not resolved yet or legacy)
        const actingDev = bug.resolvedBy || bug.developer;
        if (actingDev) {
            initMetric(devMetricsMap, actingDev);
            devMetricsMap[actingDev.id].assigned++;
            if (['TESTING', 'FIXED', 'READY_FOR_RETEST', 'VERIFIED', 'CLOSED'].includes(bug.status)) devMetricsMap[actingDev.id].resolved++;
            if (bug.isInvalid) devMetricsMap[actingDev.id].invalid++;
            if (bug.reopenCount > 0) devMetricsMap[actingDev.id].reopened++;
            devMetricsMap[actingDev.id].totalTime += (bug.devTimeSpent || bug.timeSpent || 0);

            // Check if overdue against project end date
            if (bug.project.endDate && bug.resolvedAt && bug.resolvedAt > bug.project.endDate) {
                devMetricsMap[actingDev.id].overdue++;
                totalOverdueProjectsBugs++;
            } else if (bug.project.endDate && !['TESTING', 'FIXED', 'READY_FOR_RETEST', 'VERIFIED', 'CLOSED'].includes(bug.status) && new Date() > bug.project.endDate) {
                devMetricsMap[actingDev.id].overdue++;
                totalOverdueProjectsBugs++;
            }
        }
        
        // Track Tester Action (Fallback to assigned tester if not verified yet or legacy)
        const actingTester = bug.verifiedBy || bug.tester;
        if (actingTester) {
            initMetric(testerMetricsMap, actingTester);
            testerMetricsMap[actingTester.id].assigned++; // "Tested/Assigned"
            if (['VERIFIED', 'CLOSED'].includes(bug.status)) testerMetricsMap[actingTester.id].resolved++;
            if (bug.isInvalid) testerMetricsMap[actingTester.id].invalid++;
            if (bug.reopenCount > 0) testerMetricsMap[actingTester.id].reopened++;
            testerMetricsMap[actingTester.id].totalTime += (bug.testerTimeSpent || 0);
        }
    });

    const reportersArray = Object.values(reporterMetrics).sort((a, b) => b.assigned - a.assigned);
    const devMetrics = Object.values(devMetricsMap).sort((a, b) => b.assigned - a.assigned);
    const testerMetrics = Object.values(testerMetricsMap).sort((a, b) => b.assigned - a.assigned);

    // Export Data Prep (Combining all for general export)
    const exportColumns = [
        { header: 'User Name', key: 'name' },
        { header: 'Role', key: 'role' },
        { header: 'Items Touched', key: 'assigned' },
        { header: 'Successful Closures', key: 'resolved' },
        { header: 'Average Time (mins)', key: 'avgTime' },
        { header: 'Invalidated', key: 'invalid' },
        { header: 'Reopened', key: 'reopened' },
        { header: 'Overdue Bugs', key: 'overdue' },
    ];
    // Create a combined list uniquely keyed by ID for export
    const allUsersMap = new Map<string, any>();
    [...reportersArray, ...devMetrics, ...testerMetrics].forEach(m => {
        if (!allUsersMap.has(m.id)) {
            allUsersMap.set(m.id, {
                name: m.name, role: m.role,
                assigned: m.assigned, resolved: m.resolved, invalid: m.invalid, reopened: m.reopened, overdue: m.overdue, totalTime: m.totalTime
            });
        } else {
            const current = allUsersMap.get(m.id);
            current.assigned += m.assigned;
            current.resolved += m.resolved;
            current.invalid += m.invalid;
            current.reopened += m.reopened;
            current.overdue += m.overdue;
            current.totalTime += m.totalTime;
        }
    });
    const exportData = Array.from(allUsersMap.values()).map((m: any) => ({
        ...m,
        avgTime: m.resolved > 0 ? Math.round(m.totalTime / m.resolved) : 0
    }));

    const assigneesFilter = {
        id: 'assigneeId',
        label: 'Developer / Tester',
        options: allUsers.map(u => ({ value: u.id, label: u.name }))
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Performance Analytics</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isDevOrTester ? "Your personal performance metrics." : "Team velocity, accuracy, and workload distribution."}
                    </p>
                </div>
                <div className="print:hidden">
                    <ReportActions data={exportData} filename="performance-report" columns={exportColumns} />
                </div>
            </div>

            <div className="print:hidden">
                <ReportFilters projects={projects} extraFilters={[assigneesFilter]} />
            </div>

            {/* PM Specific KPI Summary */}
            {isManager && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Project Bugs</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{bugs.length}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue SLA / Timeline</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{totalOverdueProjectsBugs}</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total People Evaluated</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{exportData.length}</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Tables */}
            <div className="space-y-8">
                {(!isDevOrTester || session.user.role === 'PROJECT_MANAGER' || session.user.role === 'ADMIN') && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-semibold text-slate-800 dark:text-white">PM & Reporter Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800/10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reporter</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reported</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Successfully Fixed</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Time to Fix</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invalid Submissions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                    {reportersArray.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{m.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">{m.assigned}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                    <CheckCircle className="w-4 h-4" /> {m.resolved}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">
                                                {m.resolved > 0 ? Math.round(m.totalTime / m.resolved) : 0} mins
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={m.invalid > 0 ? "text-red-500 font-medium inline-flex items-center gap-1 justify-center" : "text-slate-500"}>
                                                    {m.invalid > 0 && <XCircle className="w-4 h-4" />} {m.invalid}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {reportersArray.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No reporter data available for this timeframe/project.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {(!isDevOrTester || session.user.role === 'DEVELOPER') && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-semibold text-slate-800 dark:text-white">Developer Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800/10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Developer</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fixed / Verified</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Time / Bug</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Missed/Reopened</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invalid Submissions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                    {devMetrics.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{m.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">{m.assigned}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                    <CheckCircle className="w-4 h-4" /> {m.resolved}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">
                                                {m.resolved > 0 ? Math.round(m.totalTime / m.resolved) : 0} mins
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={m.reopened > 0 ? "text-orange-600 font-medium" : "text-slate-500"}>
                                                    {m.reopened}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={m.invalid > 0 ? "text-red-500 font-medium inline-flex items-center gap-1 justify-center" : "text-slate-500"}>
                                                    {m.invalid > 0 && <XCircle className="w-4 h-4" />} {m.invalid}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {devMetrics.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No developer data available for this timeframe/project.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(!isDevOrTester || session.user.role === 'TESTER') && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-semibold text-slate-800 dark:text-white">Tester Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800/10">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tester</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reported/Tested</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Closures</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Time to Verify</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Missed/Reopened</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invalid Submissions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                    {testerMetrics.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{m.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">{m.assigned}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                    <CheckCircle className="w-4 h-4" /> {m.resolved}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">
                                                {m.resolved > 0 ? Math.round(m.totalTime / m.resolved) : 0} mins
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={m.reopened > 0 ? "text-orange-600 font-medium" : "text-slate-500"}>
                                                    {m.reopened}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={m.invalid > 0 ? "text-red-500 font-medium inline-flex items-center gap-1 justify-center" : "text-slate-500"}>
                                                    {m.invalid > 0 && <XCircle className="w-4 h-4" />} {m.invalid}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {testerMetrics.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No tester data available for this timeframe/project.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {exportData.length === 0 && (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Performance Data</h3>
                        <p className="text-slate-500 dark:text-slate-400">No resolved or tracked bugs found for the selected timeline/project.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
