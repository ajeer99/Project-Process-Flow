import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ModuleForm from './module-form';
import prisma from '@/app/lib/prisma';

export default async function CreateModulePage() {
    // Fetch projects to populate the Dropdown select
    const projects = await prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    const subModules = await prisma.subModule.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/modules"
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create & Manage Modules</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a new component or manage sub-modules.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <ModuleForm projects={projects} initialSubModules={subModules} />
            </div>
        </div>
    );
}
