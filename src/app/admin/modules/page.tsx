import Link from 'next/link';
import { Plus, Search, Trash2, Package } from 'lucide-react';
import { deleteModule } from '../../lib/actions/module';
import { ModuleCard } from './module-card';
import prisma from '@/app/lib/prisma';
import { ExportButton } from '../components/export-button';

export default async function ModulesPage() {
    const modules = await prisma.module.findMany({
        orderBy: { name: 'asc' },
        include: {
            project: {
                select: { name: true }
            },
            subModules: true,
            _count: {
                select: { bugs: true }
            }
        }
    });
    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Modules</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage system modules and components across your projects.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButton data={modules} filename="modules_export" />
                    <Link
                        href="/admin/modules/create"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">New Module</span>
                        <span className="sm:hidden">New</span>
                    </Link>
                </div>
            </div>
            {/* Controls */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search modules..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
            </div>
            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {modules.map((mod) => (
                    <ModuleCard key={mod.id} mod={mod} />
                ))}
                {modules.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                            <Package className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No modules found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by creating your first module for a project.</p>
                        <Link
                            href="/admin/modules/create"
                            className="mt-6 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                        >
                            Create a module <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
