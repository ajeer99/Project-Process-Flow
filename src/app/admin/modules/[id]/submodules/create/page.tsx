import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SubModuleForm from './submodule-form';
import { notFound } from 'next/navigation';
import prisma from '@/app/lib/prisma';

type Props = {
    params: Promise<{ id: string }>
}

export default async function CreateSubModulePage({ params }: Props) {
    const { id } = await params;

    const module = await prisma.module.findUnique({
        where: { id },
        include: { project: true, subModules: { orderBy: { name: 'asc' } } }
    });

    if (!module) notFound();

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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Sub-Module</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Adding a component to <strong className="text-slate-700 dark:text-slate-300">"{module.name}"</strong>
                        &nbsp;({module.project.name})
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <SubModuleForm moduleId={module.id} moduleName={module.name} subModules={module.subModules} />
            </div>
        </div>
    );
}
