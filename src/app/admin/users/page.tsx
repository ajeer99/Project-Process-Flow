import { Plus, Search, Users as UsersIcon, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { UserRow } from './user-row';
import { GroupRow } from '../groups/group-row';
import prisma from '@/app/lib/prisma';
import { redirect } from 'next/navigation';

import { auth } from '../../../../auth';
import { ExportButton } from '../components/export-button';

export default async function TeamManagementPage({
    searchParams
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const session = await auth();
    const currentUserRole = (session?.user as any)?.role as string;
    
    const sp = await searchParams;
    const currentTab = sp.tab || 'users';

    let users: any[] = [];
    let groups: any[] = [];

    if (currentTab === 'users') {
        users = await prisma.user.findMany({
            where: currentUserRole === 'PROJECT_MANAGER' ? { role: { not: 'ADMIN' } } : undefined,
            orderBy: { createdAt: 'desc' }
        });
    } else {
        groups = await prisma.group.findMany({
            orderBy: { createdAt: 'desc' },
            include: { users: true }
        });
    }

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-indigo-500" />
                        Team Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage user roles, access, and assignment groups across the system.
                    </p>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                    <ExportButton data={currentTab === 'users' ? users : groups} filename={`${currentTab}_export`} />
                    {currentTab === 'users' ? (
                        <Link
                            href="/admin/users/create"
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">New User</span>
                            <span className="sm:hidden">New</span>
                        </Link>
                    ) : (
                        <Link
                            href="/admin/groups/create"
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">New Group</span>
                            <span className="sm:hidden">New</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Tabs & Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                
                {/* Tab Navigation */}
                <div className="flex items-center w-full sm:w-auto bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    <Link
                        href="/admin/users?tab=users"
                        replace
                        className={`flex-1 sm:flex-none text-center px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                            currentTab === 'users' 
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        Members
                    </Link>
                    <Link
                        href="/admin/users?tab=groups"
                        replace
                        className={`flex-1 sm:flex-none text-center px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                            currentTab === 'groups' 
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        Role Groups
                    </Link>
                </div>

                {/* Search */}
                <div className="relative flex-1 w-full max-w-md ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={`Search ${currentTab === 'users' ? 'users' : 'groups'}...`}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Data View */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                
                {currentTab === 'users' ? (
                    <div className="animate-in fade-in duration-300 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">Session Hours</th>
                                    <th className="px-6 py-4 font-medium">Joined Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {users.map((user) => (
                                    <UserRow key={user.id} user={user} />
                                ))}

                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Group Name</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium">Description</th>
                                    <th className="px-6 py-4 font-medium">Members</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {groups.map((group) => (
                                    <GroupRow key={group.id} group={group} />
                                ))}

                                {groups.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                    <Settings2 className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-sm font-medium">No groups created yet.</p>
                                                <p className="text-xs max-w-sm">Groups allow you to quickly assign bugs to multiple people at once (e.g. all QA testers).</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
