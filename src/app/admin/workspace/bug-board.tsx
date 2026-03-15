'use client';

import { useState } from 'react';
import { updateBugStatus } from '../../lib/actions/bug';
import { BugIcon, AlertCircle, Clock, CheckCircle2, MoreHorizontal, ArrowRight, Package, GitPullRequestDraft, Star } from 'lucide-react';
import Link from 'next/link';
import { BugPinButton } from '../../components/bug-pin-button';

interface Bug {
    id: string;
    title: string;
    status: string;
    severity: string;
    updatedAt: string | Date;
    module: { name: string; project: { name: string } };
    build: { version: string };
    developer?: { name: string | null; email: string } | null;
    tester?: { name: string | null; email: string } | null;
    isPinned: boolean;
}

interface Column {
    id: string;
    title: string;
    statuses: string[];
}

export function BugBoard({ bugs, columns, role }: { bugs: Bug[], columns: Column[], role: string }) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleStatusChange = async (bugId: string, newStatus: string) => {
        setUpdatingId(bugId);
        try {
            await updateBugStatus(bugId, newStatus);
            // The server action revalidates the path, so Next.js will automatically refetch bugs
        } catch (error) {
            console.error('Failed to change status:', error);
            alert('Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const statusOptions = role === 'DEVELOPER' 
        ? ['IN_PROGRESS', 'READY_FOR_RETEST', 'NEED_MORE_INFO', 'OPEN'] 
        : ['VERIFIED', 'REOPENED', 'NEED_MORE_INFO', 'READY_FOR_RETEST'];
    
    // Add all statuses so users can technically choose anything if needed, or restrict based on role.
    const allStatuses = ['OPEN', 'IN_PROGRESS', 'NEED_MORE_INFO', 'FIXED', 'READY_FOR_RETEST', 'VERIFIED', 'REOPENED'];

    // Define colors for severities
    const severityColors: Record<string, string> = {
        CRITICAL: "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
        HIGH: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
        MEDIUM: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
        LOW: "text-slate-500 bg-slate-50 dark:bg-slate-500/10",
    };

    return (
        <div className="flex flex-col gap-8 pb-4">
            {columns.map(column => {
                const columnBugs = bugs.filter(b => column.statuses.includes(b.status));
                
                if (columnBugs.length === 0) return null; // Don't show empty categories in list view

                return (
                    <div key={column.id} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                {column.title}
                                <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                    {columnBugs.length}
                                </span>
                            </h3>
                        </div>

                        <div className="grid gap-4 custom-scrollbar">
                            {columnBugs.map(bug => (
                                <div key={bug.id} className="bg-white dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {updatingId === bug.id && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${severityColors[bug.severity] || severityColors.LOW}`}>
                                                {bug.severity}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/bugs/${bug.id}`} className="font-semibold text-base text-slate-900 dark:text-white hover:text-indigo-600 truncate">
                                                    {bug.title}
                                                </Link>
                                                <div className="scale-75 origin-left">
                                                    <BugPinButton bugId={bug.id} initialPinned={bug.isPinned} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                <Package className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[150px]">{bug.module.project.name}</span>
                                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                                <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300">{bug.module.name}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <GitPullRequestDraft className="w-3.5 h-3.5" />
                                                v{bug.build.version}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {new Date(bug.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:w-auto w-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/60">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Reporter:</span>
                                            {bug.tester ? (
                                                <div title={`${bug.tester.name || bug.tester.email}`} className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                                                        {bug.tester.name?.[0].toUpperCase() || bug.tester.email[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{bug.tester.name || bug.tester.email.split('@')[0]}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Unassigned</span>
                                            )}
                                        </div>
                                        
                                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                                        <div className="relative w-full sm:w-auto">
                                            <select
                                                value={bug.status}
                                                onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                                                className="w-full sm:w-[160px] text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-3 pr-8 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer font-medium text-slate-700 dark:text-slate-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px] hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                                            >
                                                {role === 'DEVELOPER' && !statusOptions.includes(bug.status) && (
                                                    <option value={bug.status} disabled>{bug.status.replace(/_/g, ' ')}</option>
                                                )}
                                                <optgroup label="Quick Actions">
                                                    {statusOptions.map(s => (
                                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="All Statuses">
                                                    {allStatuses.map(s => (
                                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            
            {bugs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">You're all caught up!</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
                        There are no bugs assigned to you at the moment. Enjoy your clean slate!
                    </p>
                </div>
            )}
        </div>
    );
}
