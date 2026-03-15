import { PrismaClient, Status, Severity } from '@prisma/client';
import Link from 'next/link';
import { Plus, Search, Bug as BugIcon, AlertCircle, Star, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BugFilters } from '../workspace/bug-filters';
import { UserAvatar } from '../components/user-avatar';
import prisma from '@/app/lib/prisma';
import { auth } from '../../../../auth';
import { ExportButton } from '../components/export-button';

const statusColors = {
    OPEN: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    NEED_MORE_INFO: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    FIXED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    READY_FOR_RETEST: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
    VERIFIED: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
    REOPENED: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
};
const severityIcons = {
    CRITICAL: <AlertCircle className="w-4 h-4 text-rose-500" />,
    HIGH: <AlertCircle className="w-4 h-4 text-orange-500" />,
    MEDIUM: <AlertCircle className="w-4 h-4 text-amber-500" />,
    LOW: <AlertCircle className="w-4 h-4 text-slate-400" />,
};

const getIconColor = (severity: string) => {
    switch (severity) {
        case 'CRITICAL': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400';
        case 'HIGH': return 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400';
        case 'MEDIUM': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400';
        case 'LOW': return 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400';
        default: return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    }
};

export const dynamic = 'force-dynamic';

export default async function BugsPage({
    searchParams
}: {
    searchParams: Promise<{ projectId?: string; moduleId?: string; subModuleId?: string; search?: string; sort?: string; view?: string }>
}) {
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role || 'ADMIN';
    const resolvedSearchParams = await searchParams;
    const view = resolvedSearchParams.view || 'all';

    const buildViewUrl = (targetView: string) => {
        const params = new URLSearchParams();
        if (resolvedSearchParams.projectId) params.set('projectId', resolvedSearchParams.projectId);
        if (resolvedSearchParams.moduleId) params.set('moduleId', resolvedSearchParams.moduleId);
        if (resolvedSearchParams.subModuleId) params.set('subModuleId', resolvedSearchParams.subModuleId);
        if (resolvedSearchParams.search) params.set('search', resolvedSearchParams.search);
        if (resolvedSearchParams.sort) params.set('sort', resolvedSearchParams.sort);
        params.set('view', targetView);
        return `/admin/bugs?${params.toString()}`;
    };

    const andClauses: any[] = [];
    if (resolvedSearchParams.projectId) andClauses.push({ module: { projectId: resolvedSearchParams.projectId } });
    if (resolvedSearchParams.moduleId) andClauses.push({ moduleId: resolvedSearchParams.moduleId });
    if (resolvedSearchParams.subModuleId) andClauses.push({ subModuleId: resolvedSearchParams.subModuleId });
    
    // Globals security filters
    if (userRole !== 'ADMIN') {
        andClauses.push({ module: { project: { status: { not: 'ARCHIVED' } } } });
    }

    // Apply view filters matching groups too
    if (view === 'assigned' && userId) {
        andClauses.push({
            OR: [
                { developerId: userId },
                { developerGroup: { users: { some: { id: userId } } } },
                { testerId: userId },
                { testerGroup: { users: { some: { id: userId } } } }
            ]
        });
    } else if (view === 'reported' && userId) {
        andClauses.push({ creatorId: userId });
    }

    if (resolvedSearchParams.search) {
        andClauses.push({
            OR: [
                { title: { contains: resolvedSearchParams.search, mode: 'insensitive' } },
                { description: { contains: resolvedSearchParams.search, mode: 'insensitive' } }
            ]
        });
    }
    const sort = resolvedSearchParams.sort || 'newest';
    const dateOrder = sort === 'oldest' ? 'asc' : 'desc';
    
    const bugs = await prisma.bug.findMany({
        where: andClauses.length > 0 ? { AND: andClauses } : {},
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: dateOrder }
        ],
        include: {
            module: { select: { name: true, project: { select: { name: true } } } },
            subModule: { select: { name: true } },
            build: { select: { version: true } },
            creator: { select: { name: true, email: true, avatarUrl: true } },
            tester: { select: { name: true, email: true, avatarUrl: true } },
            developer: { select: { name: true, email: true, avatarUrl: true } },
            testerGroup: { select: { name: true } },
            developerGroup: { select: { name: true } }
        }
    });

    const projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            modules: {
                select: {
                    id: true,
                    name: true,
                    subModules: { select: { id: true, name: true } }
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bug Tracking</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View, assign, and manage defects across all projects.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton data={bugs} filename="bugs_export" />
                    <Link
                        href="/admin/bugs/create"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Report Bug</span>
                        <span className="sm:hidden">Report</span>
                    </Link>
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto whitespace-nowrap hide-scrollbar">
                    <Link 
                        href={buildViewUrl('all')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                            view === 'all' 
                                ? "text-indigo-600 dark:text-indigo-400" 
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <BugIcon className="w-4 h-4" /> All Bugs
                        {view === 'all' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                    </Link>
                    <Link 
                        href={buildViewUrl('reported')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                            view === 'reported' 
                                ? "text-indigo-600 dark:text-indigo-400" 
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <Target className="w-4 h-4" /> Reported by Me
                        {view === 'reported' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                    </Link>
                    <Link 
                        href={buildViewUrl('assigned')}
                        className={cn(
                            "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                            view === 'assigned' 
                                ? "text-indigo-600 dark:text-indigo-400" 
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <AlertCircle className="w-4 h-4" /> Assigned to Me
                        {view === 'assigned' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
                    </Link>
                </div>
                
                <BugFilters projects={projects} />
                <form action="" className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {resolvedSearchParams.view && <input type="hidden" name="view" value={resolvedSearchParams.view} />}
                    {resolvedSearchParams.projectId && <input type="hidden" name="projectId" value={resolvedSearchParams.projectId} />}
                    {resolvedSearchParams.moduleId && <input type="hidden" name="moduleId" value={resolvedSearchParams.moduleId} />}
                    {resolvedSearchParams.subModuleId && <input type="hidden" name="subModuleId" value={resolvedSearchParams.subModuleId} />}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={resolvedSearchParams.search}
                            placeholder="Search bugs by titles or descriptions..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
                        Search
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-white sm:pl-6">Bug</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Severity</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Project / Module</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Developer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-transparent">
                            {bugs.map((bug) => (
                                <tr key={bug.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 relative flex items-center justify-center">
                                                <div className={cn("w-full h-full rounded-lg flex items-center justify-center", getIconColor(bug.severity))}>
                                                    <BugIcon className="w-4 h-4" />
                                                </div>
                                                {bug.isPinned && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <Link href={`/admin/bugs/${bug.id}`} className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {bug.title}
                                                </Link>
                                                <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flexItems gap-1">
                                                    Reported by
                                                    <span className="inline-flex items-center gap-1.5 font-medium ml-1">
                                                        {(bug as any).creator ? (
                                                            <>
                                                                <UserAvatar src={(bug as any).creator.avatarUrl} name={(bug as any).creator.name} email={(bug as any).creator.email} size={16} />
                                                                {(bug as any).creator.name || (bug as any).creator.email.split('@')[0]}
                                                            </>
                                                        ) : (
                                                            bug.testerGroup?.name || 'Unknown'
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            {severityIcons[bug.severity as keyof typeof severityIcons] || null}
                                            {bug.severity}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={cn(
                                            "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
                                            statusColors[bug.status as keyof typeof statusColors] || "bg-slate-50 text-slate-600 ring-slate-500/10"
                                        )}>
                                            {bug.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="font-medium text-slate-900 dark:text-slate-300">{bug.module.project.name}</div>
                                        <div className="text-xs">{bug.module.name} {(bug as any).subModule && `> ${(bug as any).subModule.name}`} (v{bug.build.version})</div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {bug.developer ? (
                                            <span className="inline-flex items-center gap-2 font-medium">
                                                <UserAvatar src={(bug as any).developer.avatarUrl} name={bug.developer.name} email={bug.developer.email} size={24} />
                                                {bug.developer.name || bug.developer.email.split('@')[0]}
                                            </span>
                                        ) : bug.developerGroup ? (
                                            <span className="inline-flex items-center gap-2 font-medium">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-700/50">G</div>
                                                {bug.developerGroup.name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bugs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No bugs reported yet.
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
