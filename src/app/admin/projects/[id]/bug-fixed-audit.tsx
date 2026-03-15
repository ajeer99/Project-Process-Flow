'use client';

import { useState } from 'react';
import { CheckCircle, ShieldCheck, ChevronDown, ChevronUp, AlignLeft } from 'lucide-react';
import { UserAvatar } from '../../components/user-avatar';
import Link from 'next/link';

function AuditTableRow({ bug }: { bug: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-indigo-500 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <Link href={`/admin/bugs/${bug.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline max-w-[200px] truncate block" onClick={e => e.stopPropagation()}>
                            {bug.title}
                        </Link>
                    </div>
                </td>
                <td className="px-6 py-4">
                    {bug.developer ? (
                        <div className="flex items-center gap-2">
                            <UserAvatar name={bug.developer.name} src={bug.developer.avatarUrl} className="w-6 h-6 text-xs" />
                            <span className="text-slate-700 dark:text-slate-300">{bug.developer.name}</span>
                        </div>
                    ) : bug.developerGroup ? (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700">G</div>
                            <span>{bug.developerGroup.name}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                    )}
                </td>
                <td className="px-6 py-4">
                    {bug.tester ? (
                        <div className="flex items-center gap-2">
                            <UserAvatar name={bug.tester.name} src={bug.tester.avatarUrl} className="w-6 h-6 text-xs" />
                            <span className="text-slate-700 dark:text-slate-300">{bug.tester.name}</span>
                        </div>
                    ) : bug.testerGroup ? (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-700">G</div>
                            <span>{bug.testerGroup.name}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                    )}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(bug.updatedAt).toLocaleDateString()}{' '}
                    <span className="text-xs">{new Date(bug.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </td>
                <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                        bug.status === 'VERIFIED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                    }`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {bug.status}
                    </span>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
                    <td colSpan={5} className="px-6 py-4">
                        <div className="pl-10 pr-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                    <AlignLeft className="w-3.5 h-3.5" />
                                    Issue Description
                                </h4>
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {bug.description || <span className="text-slate-400 italic">No description provided.</span>}
                                </div>
                                {(bug.module || bug.severity) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                        {bug.module && (
                                            <div>
                                                <span className="text-xs font-medium text-slate-500">Module: </span>
                                                <Link href={`/admin/projects/${bug.projectId}/modules/${bug.moduleId}/analytics`} className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded transition-colors inline-block" title="View Module Analytics">
                                                    {bug.module.name}
                                                </Link>
                                            </div>
                                        )}
                                        {bug.severity && (
                                            <div>
                                                <span className="text-xs font-medium text-slate-500">Severity: </span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                    bug.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                                                    bug.severity === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                                                    bug.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                                }`}>{bug.severity}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export function BugFixedAudit({ bugs }: { bugs: any[] }) {
    // Filter only FIXED or VERIFIED bugs
    const completedBugs = bugs.filter(b => ['FIXED', 'VERIFIED'].includes(b.status));

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        Resolution Audit Log
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record of all resolved and verified tickets for accountability.</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-medium text-sm">
                    {completedBugs.length} Resolutions
                </div>
            </div>

            {completedBugs.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Issue</th>
                                <th className="px-6 py-4 font-medium">Solver (Developer)</th>
                                <th className="px-6 py-4 font-medium">QA Tester</th>
                                <th className="px-6 py-4 font-medium">Resolved On</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {completedBugs.map((bug) => (
                                <AuditTableRow key={bug.id} bug={bug} />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No bugs have been marked as Fixed or Verified yet.</p>
                </div>
            )}
        </div>
    );
}
