import { auth } from '../../../../../auth';
import prisma from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { ProjectCard } from '../../projects/project-card';
import { Bug, FolderKanban, Users } from 'lucide-react';

export default async function ManagerWorkspace() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'PROJECT_MANAGER') {
        notFound();
    }

    const userId = session.user.id;

    // Fetch only projects managed by this user
    const projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: {
            _count: {
                select: { bugs: true, modules: true, users: true }
            }
        },
        orderBy: { startDate: 'desc' }
    });

    const managers = await prisma.user.findMany({
        where: { role: 'PROJECT_MANAGER' },
        select: { id: true, name: true, email: true }
    });

    const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
    const totalBugs = projects.reduce((acc, p) => acc + p._count.bugs, 0);

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="text-2xl">👋</span> Welcome back, {session.user.name}
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Here's the overview of your assigned projects.</p>
            </header>

            {/* Quick Stats Dashboard */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 mb-8 shadow-inner">
                <div className="flex items-center gap-2 mb-6 text-slate-700 dark:text-slate-300">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold">Workspace Intelligence</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Assignments</p>
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                                <FolderKanban className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{projects.length}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Projects you are managing</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Pipeline</p>
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                            {activeProjectsCount}
                            <span className="text-sm font-semibold text-emerald-500 mb-1 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                Live
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Projects currently in active testing status</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tracked Issues</p>
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                                <Bug className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalBugs}</p>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Total bugs reported across your portfolio</p>
                    </div>
                </div>
            </div>

            {/* Assigned Projects */}
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-10 mb-6">Your Projects</h2>
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} managers={managers} userRole={(session.user as any).role} />
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Projects Assigned</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">You haven't been assigned to manage any projects yet. Please contact an Administrator.</p>
                </div>
            )}
        </div>
    );
}

// Simple fallback icon
function Activity({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
    )
}
