import Link from 'next/link';
import { Plus, Search, Trash2, GitPullRequestDraft } from 'lucide-react';
import { deleteBuild } from '../../lib/actions/build';
import prisma from '@/app/lib/prisma';
import { ExportButton } from '../components/export-button';

import { auth } from '../../../../auth';

export default async function BuildsPage() {
    const session = await auth();
    const userRole = (session?.user as any)?.role || 'ADMIN';
    const userId = session?.user?.id;

    const builds = await prisma.build.findMany({
        where: userRole === 'PROJECT_MANAGER' ? {
            project: { managerId: userId }
        } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            project: { select: { name: true } },
            _count: { select: { bugs: true } }
        }
    });
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Build Deliveries</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track upcoming software builds and their linked defect tickets.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton data={builds} filename="builds_export" />
                    <Link
                        href="/admin/builds/create"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">New Build</span>
                        <span className="sm:hidden">New</span>
                    </Link>
                </div>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by version or project..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {builds.map((build) => (
                    <div key={build.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <GitPullRequestDraft className="w-5 h-5" />
                            </div>
                            <form action={async () => {
                                'use server';
                                await deleteBuild(build.id);
                            }}>
                                <button type="submit" className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100" title="Delete Build">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                        <div className="mb-4 flex-1">
                            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                v{build.version}
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                Project: {build.project.name}
                            </p>
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                                {build.releaseNotes || "No release notes provided."}
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(build.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                {build._count.bugs} bugs tracked
                            </span>
                        </div>
                    </div>
                ))}
                {builds.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                            <GitPullRequestDraft className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No active builds found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Deliver a new test build to begin bug logging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
