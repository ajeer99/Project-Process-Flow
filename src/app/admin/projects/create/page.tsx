import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProjectForm from './project-form';
import prisma from '@/app/lib/prisma';

export default async function CreateProjectPage() {
    const managers = await prisma.user.findMany({
        where: { role: 'PROJECT_MANAGER' },
        select: { id: true, name: true }
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/projects"
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Project</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start tracking qa testing for a new project.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <ProjectForm managers={managers} />
            </div>
        </div>
    );
}
