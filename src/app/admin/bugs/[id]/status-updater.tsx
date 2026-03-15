'use client';

import { useTransition } from 'react';
import { updateBugStatus } from '../../../lib/actions/bug';
import { RefreshCw, Play, CheckCircle2, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';

type Props = {
    bugId: string;
    currentStatus: string;
    userRole: string;
    currentUserId: string;
    developerId: string | null;
    testerId: string | null;
}

export default function StatusUpdater({ bugId, currentStatus, userRole, currentUserId, developerId, testerId }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (newStatus: string) => {
        startTransition(async () => {
            await updateBugStatus(bugId, newStatus);
        });
    };

    const isAssignedDev = userRole === 'DEVELOPER' && currentUserId === developerId;
    const isAssignedQA = userRole === 'TESTER' && currentUserId === testerId;
    const isManagerOrAdmin = userRole === 'ADMIN' || userRole === 'PROJECT_MANAGER';

    if (isManagerOrAdmin) {
        // Render the generic dropdown for managers/admins so they can force any state
        const statuses = [
            { value: 'OPEN', label: 'Open' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'NEED_MORE_INFO', label: 'Need More Info' },
            { value: 'FIXED', label: 'Fixed' },
            { value: 'READY_FOR_RETEST', label: 'Ready for Retest' },
            { value: 'VERIFIED', label: 'Verified (Closed)' },
            { value: 'REOPENED', label: 'Reopened' }
        ];

        return (
            <div className="space-y-3">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Update Ticket Status (Manager Override)
                </label>
                <div className="relative">
                    <select
                        id="status"
                        name="status"
                        disabled={isPending}
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none disabled:opacity-50 font-medium"
                    >
                        {statuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    {isPending && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Role-based explicit buttons
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Next Action</h4>
            <div className="flex flex-col gap-2">
                {userRole === 'DEVELOPER' && (
                    <>
                        {['OPEN', 'REOPENED', 'IN_PROGRESS'].includes(currentStatus) && (
                            <>
                                <button
                                    onClick={() => handleStatusChange('READY_FOR_RETEST')}
                                    disabled={isPending || (developerId !== null && !isAssignedDev)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Mark as Fixed (Send to QA)
                                </button>
                                <button
                                    onClick={() => handleStatusChange('NEED_MORE_INFO')}
                                    disabled={isPending || (developerId !== null && !isAssignedDev)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                    Need More Info
                                </button>
                            </>
                        )}
                        {/* If developer is viewing a bug that is out of their phase, just show info */}
                        {['READY_FOR_RETEST', 'VERIFIED'].includes(currentStatus) && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-sm text-slate-500 border border-slate-200 dark:border-slate-700">
                                This bug is currently in QA.
                            </div>
                        )}
                    </>
                )}

                {userRole === 'TESTER' && (
                    <>
                        {currentStatus === 'READY_FOR_RETEST' && (
                            <>
                                <button
                                    onClick={() => handleStatusChange('VERIFIED')}
                                    disabled={isPending || (testerId !== null && !isAssignedQA)} // Can verify if unassigned QA or explicitly assigned QA
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Verify Fix (Close)
                                </button>
                                <button
                                    onClick={() => handleStatusChange('REOPENED')}
                                    disabled={isPending || (testerId !== null && !isAssignedQA)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                    Reopen Issue
                                </button>
                            </>
                        )}
                        {/* If tester is viewing a bug that is not ready for retest */}
                        {['OPEN', 'IN_PROGRESS', 'REOPENED', 'NEED_MORE_INFO'].includes(currentStatus) && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-sm text-slate-500 border border-slate-200 dark:border-slate-700">
                                This bug is currently with Development.
                            </div>
                        )}
                    </>
                )}
            </div>
            {isPending && <p className="text-xs text-indigo-500 text-center animate-pulse">Updating status...</p>}
        </div>
    );
}
