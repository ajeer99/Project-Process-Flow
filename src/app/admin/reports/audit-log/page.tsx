import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportActions } from '@/components/reports/ReportActions';
import { UserCircle, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default async function AuditLogReport({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string, startDate?: string, endDate?: string, userId?: string }>
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

    // 1b. Fetch Users for the User Filter
    let usersQuery: any = { role: { in: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER'] } };
    if (isManager) {
        const projectIds = projects.map(p => p.id);
        const bugsInProj = await (prisma.bug as any).findMany({ where: { projectId: { in: projectIds } }, select: { creatorId: true, developerId: true, testerId: true, resolvedById: true, verifiedById: true } });
        const userIds = new Set<string>();
        bugsInProj.forEach((bugModel: any) => {
             const b = bugModel as any;
             if (b.creatorId) userIds.add(b.creatorId);
             if (b.developerId) userIds.add(b.developerId);
             if (b.testerId) userIds.add(b.testerId);
             if (b.resolvedById) userIds.add(b.resolvedById);
             if (b.verifiedById) userIds.add(b.verifiedById);
        });
        usersQuery.id = { in: Array.from(userIds) };
    }
    const filterUsers = await prisma.user.findMany({
        where: usersQuery,
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' }
    });

    // 2. Build Bug Query
    const bugWhere: any = {};
    
    // Global Access restrictions
    if (!isAdmin && !isManager) {
        bugWhere.OR = [
            { developerId: session.user.id },
            { testerId: session.user.id }
        ];
    } else if (isManager) {
        bugWhere.projectId = { in: projects.map(p => p.id) };
    }

    // Filter Application
    if (resolvedSearchParams.projectId && resolvedSearchParams.projectId !== 'all') {
        bugWhere.projectId = resolvedSearchParams.projectId;
        if (isManager) {
            const owns = projects.find(p => p.id === resolvedSearchParams.projectId);
            if (!owns) return <div className="p-8 text-center text-red-500">Unauthorized.</div>;
        }
    }
    
    if (resolvedSearchParams.startDate || resolvedSearchParams.endDate) {
        bugWhere.createdAt = {};
        if (resolvedSearchParams.startDate) bugWhere.createdAt.gte = new Date(resolvedSearchParams.startDate);
        if (resolvedSearchParams.endDate) bugWhere.createdAt.lte = new Date(resolvedSearchParams.endDate + 'T23:59:59.999Z');
    }

    if (resolvedSearchParams.userId && resolvedSearchParams.userId !== 'all') {
        bugWhere.OR = [
            { creatorId: resolvedSearchParams.userId },
            { developerId: resolvedSearchParams.userId },
            { testerId: resolvedSearchParams.userId },
            { resolvedById: resolvedSearchParams.userId },
            { verifiedById: resolvedSearchParams.userId }
        ];
    }

    // 3. Fetch Data
    const bugs = await (prisma.bug as any).findMany({
        where: bugWhere,
        include: {
            creator: { select: { id: true, name: true, role: true } },
            developer: { select: { id: true, name: true, role: true } },
            tester: { select: { id: true, name: true, role: true } },
            developerGroup: { select: { name: true } },
            testerGroup: { select: { name: true } },
            resolvedBy: { select: { id: true, name: true, role: true } },
            verifiedBy: { select: { id: true, name: true, role: true } },
            project: { select: { id: true, name: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Only Audit Log recent activity mappings below

    // Audit Log recent activity table mappings
    const recentActivity = bugs.slice(0, 100).map((bugModel: any) => {
        const b = bugModel as any;
        return {
        id: b.id,
        title: b.title,
        status: b.status,
        project: b.project.name,
        pmWorker: b.creator?.name || 'Unassigned PM',
        devWorker: b.resolvedBy?.name || b.developer?.name || b.developerGroup?.name || 'Unassigned Dev',
        testerWorker: b.verifiedBy?.name || b.tester?.name || b.testerGroup?.name || 'Unassigned Tester',
        pmTime: b.createdAt.toLocaleString(),
        devTime: b.resolvedAt ? b.resolvedAt.toLocaleString() : 'Pending',
        testerTime: b.status === 'VERIFIED' ? b.lastStatusUpdateAt.toLocaleString() : 'Pending',
        totalTime: (b.pmTimeSpent || 0) + (b.devTimeSpent || b.timeSpent || 0) + (b.testerTimeSpent || 0),
        creatorIp: b.creatorIp || 'N/A',
        resolverIp: b.resolverIp || 'N/A',
        verifierIp: b.verifierIp || 'N/A',
        creatorMac: b.creatorMac || 'N/A',
        resolverMac: b.resolverMac || 'N/A',
        verifierMac: b.verifierMac || 'N/A',
        updatedAt: b.updatedAt.toLocaleString()
    };
    });

    // Helpers
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

    const printableData = recentActivity.map((r: any) => ({
        "Update Time": r.updatedAt,
        "Total Time": formatTime(r.totalTime),
        "Action Timeline": [
            `Reported: ${r.pmTime} by ${r.pmWorker}`,
            r.devTime !== 'Pending' ? `Resolved: ${r.devTime} by ${r.devWorker}` : 'Resolved: Pending',
            r.testerTime !== 'Pending' ? `Verified: ${r.testerTime} by ${r.testerWorker}` : 'Verified: Pending'
        ].join(' | ')
    }));


    return (
        <div className="print:bg-white print:text-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">System Audit Log</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Chronological timeline of system-wide individual bug file interactions.</p>
                </div>
                <div className="flex gap-2">
                    <ReportActions 
                        data={printableData} 
                        filename="system-audit-log" 
                        columns={[
                            { header: 'Update Time', key: 'Update Time' },
                            { header: 'Bug Reference', key: 'Bug Reference' },
                            { header: 'Status State', key: 'Status State' },
                            { header: 'Action Timeline', key: 'Action Timeline' },
                            { header: 'Total Time', key: 'Total Time' },
                            { header: 'Action IPs', key: 'Action IPs' },
                            { header: 'MAC Addresses', key: 'MAC Addresses' }
                        ]}
                    />
                </div>
            </div>

            <div className="hidden print:block mb-8">
                <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <div className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-2">System Audit Report</div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Application Activity</h1>
                        <p className="text-slate-600 mt-2 max-w-2xl">Chronological timeline of system-wide interactions.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Generated On</div>
                        <div className="font-bold text-slate-900 text-lg">{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            <div className="print:hidden mb-6">
                <ReportFilters 
                    projects={projects} 
                    extraFilters={[
                        {
                            id: 'userId',
                            label: 'Involved Member',
                            options: filterUsers.map(a => ({ value: a.id, label: `${a.name} (${a.role.substring(0,3)})` }))
                        }
                    ]}
                />
            </div>

            {/* Raw Audit Log */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none print:mt-4">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-semibold text-slate-800 dark:text-white">Recent Bug File Updates</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/10 print:bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Update Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bug Reference</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status State</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Timeline</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action IPs</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MAC Addresses</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {recentActivity.map((act: any) => (
                                <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 break-inside-avoid">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                                        {act.updatedAt}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white print:text-black truncate max-w-[200px] print:max-w-none print:whitespace-normal" title={act.title}>{act.title}</span>
                                            <span className="text-xs text-slate-500">{act.project}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {act.status.replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Reported</span>
                                                <span className="text-slate-900 dark:text-white font-medium text-xs">{act.pmTime}</span>
                                                <span className="text-xs text-slate-500">{act.pmWorker}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Resolved</span>
                                                {act.devTime !== 'Pending' ? (
                                                    <>
                                                        <span className="text-slate-900 dark:text-white font-medium text-xs">{act.devTime}</span>
                                                        <span className="text-xs text-slate-500">{act.devWorker}</span>
                                                    </>
                                                ) : <span className="text-slate-400 text-xs italic">Pending</span>}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Verified</span>
                                                {act.testerTime !== 'Pending' ? (
                                                    <>
                                                        <span className="text-slate-900 dark:text-white font-medium text-xs">{act.testerTime}</span>
                                                        <span className="text-xs text-slate-500">{act.testerWorker}</span>
                                                    </>
                                                ) : <span className="text-slate-400 text-xs italic">Pending</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatTime(act.totalTime)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                        <div className="flex flex-col gap-2">
                                            <div><span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Rep: </span>{act.creatorIp}</div>
                                            {act.devTime !== 'Pending' && <div><span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Res: </span>{act.resolverIp}</div>}
                                            {act.testerTime !== 'Pending' && <div><span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ver: </span>{act.verifierIp}</div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                        <div className="flex flex-col gap-2">
                                            <div><span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Rep: </span>{act.creatorMac}</div>
                                            {act.devTime !== 'Pending' && <div><span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Res: </span>{act.resolverMac}</div>}
                                            {act.testerTime !== 'Pending' && <div><span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ver: </span>{act.verifierMac}</div>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 1cm;
                    }
                    html, body {
                        background: white;
                        color: black;
                        width: 100%;
                        max-width: 100%;
                    }
                    table {
                        width: 100% !important;
                        table-layout: fixed !important;
                        font-size: 9px !important;
                    }
                    th, td {
                        word-wrap: break-word;
                        white-space: normal !important;
                        padding: 4px !important;
                    }
                    .text-xs { font-size: 8px !important; line-height: 1.2 !important; }
                    .text-sm { font-size: 9px !important; line-height: 1.2 !important; }
                    .text-[10px] { font-size: 7px !important; }
                    
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}} />
        </div>
    );
}
