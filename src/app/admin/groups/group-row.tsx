'use client';

import { Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteGroup } from '@/app/lib/actions/group';

export function GroupRow({ group }: { group: any }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this group?')) return;
        setIsDeleting(true);
        const res = await deleteGroup(group.id);
        setIsDeleting(false);
        if (res?.error) {
            alert(res.error);
        }
    };

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/row">
            <td className="px-6 py-4">
                <Link href={`/admin/groups/${group.id}/edit`} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                    {group.name}
                </Link>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    group.type === 'TESTER' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                }`}>
                    {group.type}
                </span>
            </td>
            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                {group.description || <span className="text-slate-400 italic">No description</span>}
            </td>
            <td className="px-6 py-4">
                <div className="flex -space-x-2 overflow-hidden">
                    {group.users.slice(0, 5).map((u: any) => (
                        <div key={u.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-medium text-indigo-700 dark:text-indigo-300" title={u.name}>
                            {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {group.users.length > 5 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500">
                            +{group.users.length - 5}
                        </div>
                    )}
                    {group.users.length === 0 && (
                        <span className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-2 rounded-full h-8 flex items-center">
                            Empty
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2 h-8">
                    {isDeleting && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    
                    <Link
                        href={`/admin/groups/${group.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Edit Group"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Delete Group"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
