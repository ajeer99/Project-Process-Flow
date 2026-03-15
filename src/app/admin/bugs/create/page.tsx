import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BugForm from './bug-form';
import prisma from '@/app/lib/prisma';

export default async function ReportBugPage() {
    // Fetch data for the relational dropdowns
    const builds = await prisma.build.findMany({
        select: { id: true, version: true, projectId: true, project: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });
    const modules = await prisma.module.findMany({
        select: { id: true, name: true, projectId: true },
        orderBy: { name: 'asc' }
    });
    const subModules = await prisma.subModule.findMany({
        select: { id: true, name: true, moduleId: true },
        orderBy: { name: 'asc' }
    });
    const developers = await prisma.user.findMany({
        where: { role: 'DEVELOPER' },
        select: { id: true, name: true, email: true }
    });
    const groups = await prisma.group.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });
    const managers = await prisma.user.findMany({
        where: { role: 'PROJECT_MANAGER' },
        select: { id: true, name: true, email: true }
    });
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/bugs"
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Report a Bug</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Provide comprehensive details to help developers fix this issue quickly.</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <BugForm builds={builds} modules={modules} subModules={subModules} developers={developers} groups={groups} managers={managers} />
            </div>
        </div>
    );
}
