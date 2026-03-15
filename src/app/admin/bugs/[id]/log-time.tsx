'use client';

import { useState } from 'react';
import { logBugTime } from '@/app/lib/actions/bug';
import { Clock, Loader2, Plus } from 'lucide-react';

export default function LogTime({ 
    bugId, 
    currentTotalMins = 0, 
    pmTimeSpent = 0,
    devTimeSpent = 0,
    testerTimeSpent = 0,
    userRole 
}: { 
    bugId: string, 
    currentTotalMins?: number, 
    pmTimeSpent?: number,
    devTimeSpent?: number,
    testerTimeSpent?: number,
    userRole?: string 
}) {
    const [minutes, setMinutes] = useState<number | ''>('');
    const [bucket, setBucket] = useState<'pm' | 'dev' | 'tester'>('dev');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!minutes || minutes <= 0) {
            setError('Please enter a valid duration.');
            return;
        }

        setIsSubmitting(true);
        const res = await logBugTime(bugId, Number(minutes), bucket);
        setIsSubmitting(false);

        if (res.error) {
            setError(res.error);
        } else {
            setSuccess(`Added ${minutes} minutes.`);
            setMinutes('');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const formatTime = (mins: number) => {
        if (!mins || mins === 0) return '0 m';
        if (mins < 1) return Math.round(mins * 60) + ' s';
        if (mins < 60) {
            const m = Math.floor(mins);
            const s = Math.round((mins - m) * 60);
            return s > 0 ? `${m}m ${s}s` : `${m} m`;
        }
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return m > 0 ? `${h}h ${m}m` : `${h} h`;
    };

    const overallTotalMins = (pmTimeSpent || 0) + (devTimeSpent || 0) + (testerTimeSpent || 0) + currentTotalMins;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Time Tracking
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Total: {formatTime(overallTotalMins)}
                </span>
            </div>
            
            {userRole === 'ADMIN' ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Mins..."
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                disabled={isSubmitting}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                m
                            </span>
                        </div>
                        <select
                            value={bucket}
                            onChange={(e) => setBucket(e.target.value as any)}
                            disabled={isSubmitting}
                            className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-2 py-2 outline-none"
                        >
                            <option value="pm">PM</option>
                            <option value="dev">Dev</option>
                            <option value="tester">Tester</option>
                        </select>
                        <button
                            type="submit"
                            disabled={isSubmitting || !minutes}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                            title="Log Time"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                    </div>
                    
                    {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
                    {success && <p className="text-xs text-emerald-500 mt-1 font-medium">{success}</p>}
                    
                    <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <strong>Admin Override:</strong> Manually adjust time tracking metrics.
                    </p>
                </form>
            ) : (
                <div className="py-2 space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        This issue has accumulated <strong className="text-indigo-600 dark:text-indigo-400">{formatTime(overallTotalMins)}</strong> of active effort.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="text-slate-500 mb-1">Project Mgt</div>
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{formatTime(pmTimeSpent)}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="text-slate-500 mb-1">Development</div>
                            <div className="font-semibold text-indigo-600 dark:text-indigo-400">{formatTime(devTimeSpent)}</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="text-slate-500 mb-1">Testing</div>
                            <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatTime(testerTimeSpent)}</div>
                        </div>
                    </div>
                    {currentTotalMins > 0 && (
                        <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                            Includes {formatTime(currentTotalMins)} of unbucketed legacy time.
                        </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2 italic border-t border-slate-100 dark:border-slate-800 pt-2">
                        * Time tracking is automatically bucketed based on the duration a bug spends in specific states (e.g. In Progress = Dev time).
                    </p>
                </div>
            )}
        </div>
    );
}
