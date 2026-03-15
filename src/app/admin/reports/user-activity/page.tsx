import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportActions } from '@/components/reports/ReportActions';
import { UserCircle, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default async function UserActivityReport({
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

    // 4. Data Transformation: We need a User -> Project -> Stats mapping
    // We want to know: For this exact user, on this exact project, how much time did they spend, and how many bugs did they fix?
    type UserProjectStat = {
        userId: string;
        userName: string;
        userRole: string;
        projectId: string;
        projectName: string;
        totalBugs: number;
        fixedBugs: number;
        pendingBugs: number;
        timeSpent: number;
    }

    const mapping: Record<string, UserProjectStat> = {};

    bugs.forEach((b: any) => {
        const bug = b as any;

        // Helper to add stats to a specific user
        const addUserStat = (user: any, timeElapsed: number, bugStatus: string, roleBucket: 'DEV' | 'TEST' | 'CREATOR') => {
            if (!user) return;
            const key = `${user.id}-${bug.project.id}`;
            if (!mapping[key]) {
                mapping[key] = {
                    userId: user.id, userName: user.name, userRole: user.role,
                    projectId: bug.project.id, projectName: bug.project.name,
                    totalBugs: 0, fixedBugs: 0, pendingBugs: 0, timeSpent: 0
                };
            }
            // Count total/pending/fixed based on their bucket logic
            mapping[key].totalBugs++;
            
            if (roleBucket === 'DEV') {
                if (['OPEN', 'IN_PROGRESS', 'NEED_MORE_INFO', 'REOPENED'].includes(bugStatus)) mapping[key].pendingBugs++;
                else if (['FIXED', 'READY_FOR_RETEST', 'VERIFIED', 'CLOSED'].includes(bugStatus)) mapping[key].fixedBugs++;
            } else if (roleBucket === 'TEST') {
                if (['FIXED', 'READY_FOR_RETEST'].includes(bugStatus)) mapping[key].pendingBugs++;
                else if (['VERIFIED', 'CLOSED'].includes(bugStatus)) mapping[key].fixedBugs++;
            } else if (roleBucket === 'CREATOR') {
                if (['OPEN', 'REOPENED'].includes(bugStatus)) mapping[key].pendingBugs++;
                else mapping[key].fixedBugs++;
            }
            
            mapping[key].timeSpent += timeElapsed;
        };

        // Dev Work Allocation
        const actualDevTime = (bug.devTimeSpent || bug.timeSpent) || 0;
        const devWorker = bug.resolvedBy || bug.developer; // If resolved, give time to resolver. If not, give pending stats to assigned dev.
        // PM / Creator Work Allocation
        const pmWorker = bug.creator;
        if (pmWorker && (bug.pmTimeSpent > 0 || pmWorker.role === 'PROJECT_MANAGER' || pmWorker.role === 'DEVELOPER' || pmWorker.role === 'TESTER')) {
             addUserStat(pmWorker, bug.pmTimeSpent || 0, bug.status, 'CREATOR');
        }
        
        // Add assigned Developer OR Resolver stats
        if (devWorker) {
            addUserStat(devWorker, actualDevTime, bug.status, 'DEV');
        }

        // Tester Work Allocation
        const testerWorker = bug.verifiedBy || bug.tester;
        const isTesterPhase = ['FIXED', 'READY_FOR_RETEST', 'VERIFIED', 'CLOSED'].includes(bug.status);
        if (testerWorker && (isTesterPhase || bug.testerTimeSpent > 0)) {
            addUserStat(testerWorker, bug.testerTimeSpent || 0, bug.status, 'TEST');
        }
    });

    const userProjectStats = Object.values(mapping).sort((a,b) => a.userName.localeCompare(b.userName) || a.projectName.localeCompare(b.projectName));

    // Export Data Prep
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
    const exportColumnsStats = [
        { header: 'User', key: 'userName' },
        { header: 'Role', key: 'userRole' },
        { header: 'Project', key: 'projectName' },
        { header: 'Total Assigned', key: 'totalBugs' },
        { header: 'Fixed/Verified', key: 'fixedBugs' },
        { header: 'Pending', key: 'pendingBugs' },
        { header: 'Time Spent (Mins)', key: 'timeSpent' },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Tracker</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Project-wise breakdown of exact user time allocations and fix progress.</p>
                </div>
                <div className="print:hidden">
                    <ReportActions data={userProjectStats} filename="user-project-audit-report" columns={exportColumnsStats} />
                </div>
            </div>

            <div className="print:hidden">
                <ReportFilters 
                    projects={projects} 
                    extraFilters={[
                        {
                            id: 'userId',
                            label: 'User',
                            options: filterUsers.map(a => ({ value: a.id, label: `${a.name} (${a.role.substring(0,3)})` }))
                        }
                    ]}
                />
            </div>

            {/* Granular User -> Project Statistics Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm mb-8">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800 dark:text-white">User Time & Fix Tracking (By Project)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/10">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tasks</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fixed / Done</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time Spent</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {userProjectStats.map(stat => (
                                <tr key={`${stat.userId}-${stat.projectId}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{stat.userName}</span>
                                            <span className="text-xs text-slate-500">{stat.userRole}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {stat.projectName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-slate-600 dark:text-slate-400">
                                        {stat.totalBugs}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                            <Clock className="w-4 h-4" /> {stat.pendingBugs}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                            <CheckCircle2 className="w-4 h-4" /> {stat.fixedBugs}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900 dark:text-white">
                                        {formatTime(stat.timeSpent)}
                                    </td>
                                </tr>
                            ))}
                            {userProjectStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                                        No activity records found matching the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            

        </div>
    );
}
