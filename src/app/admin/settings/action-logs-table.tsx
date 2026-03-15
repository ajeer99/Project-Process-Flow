import prisma from '@/app/lib/prisma';
import { Activity, Clock, ShieldAlert, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function ActionLogsTable() {
    const logs = await prisma.systemActionLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            performedBy: { select: { name: true, email: true } }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Action Logs</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recent administrative actions performed in the system (Showing last 100).</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Entity Type</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Performed By</th>
                                <th className="px-6 py-4">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p>No action logs found in the database.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                                log.action === 'DELETE' || log.action === 'SUSPEND'
                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                                    : log.action === 'CREATE' || log.action === 'RESTORE'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                                            {log.entityType}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[300px] truncate" title={log.details || ''}>
                                            {log.details || <span className="text-slate-400 italic">No details</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-slate-200">{log.performedBy.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{log.performedBy.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
