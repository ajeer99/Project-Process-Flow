import { GroupForm } from '../../group-form';
import prisma from '@/app/lib/prisma';
import { Users as UsersIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const group = await prisma.group.findUnique({
        where: { id },
        include: { users: { select: { id: true } } }
    });

    if (!group) notFound();

    const allUsers = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, email: true, role: true }
    });

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users?tab=groups"
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-indigo-500" />
                        Edit Group: {group.name}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Modify group details and membership.
                    </p>
                </div>
            </div>

            <GroupForm initialData={group} allUsers={allUsers} />
        </div>
    );
}
