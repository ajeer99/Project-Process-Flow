import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { BugDataTable } from '../components/bug-data-table';
import { BugFilters } from './bug-filters';
import prisma from '@/app/lib/prisma';
import Link from 'next/link';
import { Clock, AlertCircle, Play, CheckCircle2, RotateCcw, TestTube2, Code2, Bug as BugIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../components/user-avatar';

export const dynamic = 'force-dynamic';

const statusColors = {
    OPEN: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    NEED_MORE_INFO: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    REOPENED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
    READY_FOR_RETEST: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
    VERIFIED: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
};

const severityColors = {
    CRITICAL: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
    HIGH: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
    MEDIUM: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
    LOW: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10",
};

export default async function WorkspacePage({
    searchParams
}: {
    searchParams: Promise<{ view?: string; projectId?: string; moduleId?: string; subModuleId?: string }>
}) {
    const session = await auth();
    if (!session || !session.user) {
        redirect('/login');
    }

    const userId = session.user.id;
    const role = (session.user as any).role;
    const resolvedSearchParams = await searchParams;

    // Default view based on role
    let defaultView = 'developer';
    if (role === 'TESTER') defaultView = 'tester';
    
    let view = resolvedSearchParams.view || defaultView;

    // Security constraints on viewing cross-workspaces if not Admin/PM
    if (role === 'DEVELOPER') view = 'developer';
    if (role === 'TESTER') view = 'tester';

    const buildViewUrl = (targetView: string) => {
        const params = new URLSearchParams();
        if (resolvedSearchParams.projectId) params.set('projectId', resolvedSearchParams.projectId);
        if (resolvedSearchParams.moduleId) params.set('moduleId', resolvedSearchParams.moduleId);
        if (resolvedSearchParams.subModuleId) params.set('subModuleId', resolvedSearchParams.subModuleId);
        params.set('view', targetView);
        return `/admin/workspace?${params.toString()}`;
    };

    // FETCH LOGIC
    // -- DEVELOPER LOGIC
    let activeTasks: any[] = [];
    let backlogTasks: any[] = [];
    
    // -- TESTER LOGIC
    let readyForRetestTasks: any[] = [];
    let trackingTasks: any[] = [];

    if (view === 'developer') {
        const activeTasksWhere: any = {
            status: { in: ['OPEN', 'IN_PROGRESS', 'NEED_MORE_INFO', 'REOPENED'] }
        };
        if (role === 'DEVELOPER') {
            activeTasksWhere.OR = [
                { developerId: userId },
                { developerGroup: { users: { some: { id: userId } } } }
            ];
            activeTasksWhere.module = { project: { status: { not: 'ARCHIVED' } } };
        } else if (role === 'PROJECT_MANAGER') {
            activeTasksWhere.module = { project: { managerId: userId, status: { not: 'ARCHIVED' } } };
        }

        activeTasks = await prisma.bug.findMany({
            where: activeTasksWhere,
            include: {
                module: { select: { name: true, project: { select: { name: true } } } },
                subModule: { select: { name: true } },
                build: { select: { version: true } },
                tester: { select: { name: true, email: true, avatarUrl: true } },
            },
            orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }]
        });

        const backlogWhereClause: any = {};
        if (role === 'DEVELOPER') {
            backlogWhereClause.developerId = null;
            backlogWhereClause.developerGroupId = null;
            backlogWhereClause.status = { in: ['OPEN', 'REOPENED'] };
            backlogWhereClause.module = { project: { status: { not: 'ARCHIVED' } } };
        } else if (role === 'PROJECT_MANAGER') {
            backlogWhereClause.module = { project: { managerId: userId, status: { not: 'ARCHIVED' } } };
        }

        backlogTasks = await prisma.bug.findMany({
            where: backlogWhereClause,
            include: {
                module: { select: { name: true, project: { select: { name: true } } } },
                subModule: { select: { name: true } },
                build: { select: { version: true } },
                tester: { select: { name: true, email: true, avatarUrl: true } },
                developer: { select: { name: true, email: true, avatarUrl: true } },
            },
            orderBy: { updatedAt: 'desc' }
        });
    } else {
        // Tester View
        const readyForRetestWhere: any = {
            status: 'READY_FOR_RETEST'
        };
        if (role === 'TESTER') {
            readyForRetestWhere.OR = [
                { testerId: userId },
                { testerGroup: { users: { some: { id: userId } } } }
            ];
            readyForRetestWhere.module = { project: { status: { not: 'ARCHIVED' } } };
        } else if (role === 'PROJECT_MANAGER') {
            readyForRetestWhere.module = { project: { managerId: userId, status: { not: 'ARCHIVED' } } };
        }

        readyForRetestTasks = await prisma.bug.findMany({
            where: readyForRetestWhere,
            include: {
                module: { select: { name: true, project: { select: { name: true } } } },
                subModule: { select: { name: true } },
                build: { select: { version: true } },
                developer: { select: { name: true, email: true, avatarUrl: true } },
            },
            orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }]
        });

        const trackingWhereClause: any = {};
        if (role === 'TESTER') {
            trackingWhereClause.OR = [
                { testerId: userId },
                { testerGroup: { users: { some: { id: userId } } } }
            ];
            trackingWhereClause.module = { project: { status: { not: 'ARCHIVED' } } };
        } else if (role === 'PROJECT_MANAGER') {
            trackingWhereClause.module = { project: { managerId: userId, status: { not: 'ARCHIVED' } } };
        }

        if (resolvedSearchParams.projectId) trackingWhereClause.module = { projectId: resolvedSearchParams.projectId };
        if (resolvedSearchParams.moduleId) trackingWhereClause.moduleId = resolvedSearchParams.moduleId;
        if (resolvedSearchParams.subModuleId) trackingWhereClause.subModuleId = resolvedSearchParams.subModuleId;

        trackingTasks = await prisma.bug.findMany({
            where: trackingWhereClause,
            include: {
                module: { select: { name: true, project: { select: { name: true } } } },
                subModule: { select: { name: true } },
                build: { select: { version: true } },
                developer: { select: { name: true, email: true, avatarUrl: true } },
                tester: { select: { name: true, email: true, avatarUrl: true } },
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    const projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            modules: { select: { id: true, name: true, subModules: { select: { id: true, name: true } } } }
        }
    });

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Unified Workspace</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    Manage issue pipelines and testing flows seamlessly.
                </p>
            </div>

            {(role === 'ADMIN' || role === 'PROJECT_MANAGER') && (
                <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto whitespace-nowrap hide-scrollbar">
                    <Link 
                        href={buildViewUrl('developer')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                            view === 'developer' 
                                ? "text-indigo-600 dark:text-indigo-400" 
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <Code2 className="w-4 h-4" /> Developer Pipeline
                        {view === 'developer' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                    </Link>
                    <Link 
                        href={buildViewUrl('tester')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                            view === 'tester' 
                                ? "text-indigo-600 dark:text-indigo-400" 
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <TestTube2 className="w-4 h-4" /> QA Testing Pipeline
                        {view === 'tester' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                    </Link>
                </div>
            )}

            {view === 'developer' ? (
                <>
                    {/* Active Tasks Grid */}
                    <section>
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 mt-2">
                            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
                                <Play className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Dev Tasks</h2>
                            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                                {activeTasks.length}
                            </span>
                        </div>
                        
                        {activeTasks.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">You're all caught up!</h3>
                                <p className="mt-1">Pick up a new unassigned issue from the backlog below.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {activeTasks.map((bug) => (
                                    <Link key={bug.id} href={`/admin/bugs/${bug.id}`}>
                                        <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all h-full flex flex-col relative overflow-hidden">
                                            {bug.isPinned && (
                                                <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
                                            )}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase tracking-wider",
                                                        statusColors[bug.status as keyof typeof statusColors] || "bg-slate-50 text-slate-600 ring-slate-500/10"
                                                    )}>
                                                        {bug.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                        severityColors[bug.severity as keyof typeof severityColors] || "bg-slate-50 text-slate-600"
                                                    )}>
                                                        {bug.severity}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {bug.title}
                                            </h3>
                                            <div className="mt-auto pt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                    {bug.module.project.name}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                    {bug.module.name} {(bug as any).subModule && `> ${(bug as any).subModule.name}`}
                                                </span>
                                                {bug.tester && (
                                                    <span className="flex items-center gap-1.5 ml-auto text-slate-400">
                                                        <UserAvatar src={(bug.tester as any).avatarUrl} name={bug.tester.name} email={bug.tester.email} size={16} />
                                                        <span className="truncate max-w-[100px]">{bug.tester.name || bug.tester.email.split('@')[0]}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Global Backlog */}
                    <section className="pt-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Unassigned Backlog</h2>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                            <BugDataTable bugs={backlogTasks as any} role={role} />
                        </div>
                    </section>
                </>
            ) : (
                <>
                    {/* Ready For Verification Grid */}
                    <section>
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 mt-2">
                            <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg">
                                <TestTube2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ready For Verification</h2>
                            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                                {readyForRetestTasks.length}
                            </span>
                        </div>
                        
                        {readyForRetestTasks.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">No bugs require immediate testing.</h3>
                                <p className="mt-1">Developers are still working on your issues.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {readyForRetestTasks.map((bug) => (
                                    <Link key={bug.id} href={`/admin/bugs/${bug.id}`}>
                                        <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all h-full flex flex-col relative overflow-hidden">
                                            {bug.isPinned && (
                                                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                                            )}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase tracking-wider",
                                                        statusColors[bug.status as keyof typeof statusColors] || "bg-slate-50 text-slate-600 ring-slate-500/10"
                                                    )}>
                                                        {bug.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                        severityColors[bug.severity as keyof typeof severityColors] || "bg-slate-50 text-slate-600"
                                                    )}>
                                                        {bug.severity}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {bug.title}
                                            </h3>
                                            <div className="mt-auto pt-6 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <div className="flex gap-2">
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                        {bug.module.name} {(bug as any).subModule && `> ${(bug as any).subModule.name}`}
                                                    </span>
                                                </div>
                                                {bug.developer && (
                                                    <span className="flex items-center gap-1.5 text-slate-400 tracking-tight">
                                                        Fixed by
                                                        <UserAvatar src={(bug as any).developer?.avatarUrl} name={(bug as any).developer.name} email={(bug as any).developer.email} size={16} />
                                                        <span className="truncate max-w-[100px]">{(bug as any).developer.name || (bug as any).developer.email.split('@')[0]}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Incoming Pipeline Grid */}
                    <section className="pt-8">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 mt-2">
                            <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Incoming Pipeline</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bugs assigned to you that developers are currently fixing.</p>
                            </div>
                            <span className="ml-auto bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                                {trackingTasks.filter(b => b.status === "OPEN" || b.status === "IN_PROGRESS" || b.status === "REOPENED").length}
                            </span>
                        </div>
                        
                        {trackingTasks.filter(b => b.status === "OPEN" || b.status === "IN_PROGRESS" || b.status === "REOPENED").length === 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">Pipeline is clear.</h3>
                                <p className="mt-1">No pending developments routed to your queue.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 grayscale-[20%] hover:grayscale-0 transition-all duration-500">
                                {trackingTasks.filter(b => b.status === "OPEN" || b.status === "IN_PROGRESS" || b.status === "REOPENED").map((bug) => (
                                    <Link key={bug.id} href={`/admin/bugs/${bug.id}`}>
                                        <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all h-full flex flex-col relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase tracking-wider",
                                                        statusColors[bug.status as keyof typeof statusColors] || "bg-slate-50 text-slate-600 ring-slate-500/10"
                                                    )}>
                                                        {bug.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                        severityColors[bug.severity as keyof typeof severityColors] || "bg-slate-50 text-slate-600"
                                                    )}>
                                                        {bug.severity}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {bug.title}
                                            </h3>
                                            <div className="mt-auto pt-6 flex justify-between items-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <div className="flex gap-2">
                                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                        {(bug as any).module.name} {(bug as any).subModule && `> ${(bug as any).subModule.name}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* General Tracking Table */}
                    <section className="pt-8">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Tracked Bugs</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Every issue assigned to you, regardless of status.</p>
                                </div>
                            </div>
                            <BugFilters projects={projects} />
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                            <BugDataTable bugs={trackingTasks as any} role={role} />
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
