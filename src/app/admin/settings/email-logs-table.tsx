import prisma from '@/app/lib/prisma';
import { Mail, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default async function EmailLogsTable() {
    const logs = await prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit to recent 100 for performance
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
                    <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email Delivery Logs</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recent automated emails sent by the system (Showing last 100).</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Recipient</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <Mail className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p>No email logs found in the database.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.status === 'SENT' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                                            {log.to}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={log.subject}>
                                            {log.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </td>
                                        <td className="px-6 py-4 max-w-[250px] text-xs">
                                            {log.error ? (
                                                <span className="text-rose-600 dark:text-rose-400 line-clamp-2" title={log.error}>
                                                    {log.error}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 line-clamp-1 italic">
                                                    Content: {log.body.replace(/<[^>]*>?/gm, '').substring(0, 50)}...
                                                </span>
                                            )}
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
