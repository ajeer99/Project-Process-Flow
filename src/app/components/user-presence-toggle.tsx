'use client';

import { useState } from 'react';
import { updateUserPresence } from '../lib/actions/presence';
import { ChevronDown, Circle, CircleDashed, CircleDot } from 'lucide-react';
import { cn } from '../lib/utils';

export function UserPresenceToggle({ initialPresence }: { initialPresence: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [presence, setPresence] = useState(initialPresence);
    const [isUpdating, setIsUpdating] = useState(false);

    const statuses = [
        { value: 'ONLINE', label: 'Online', icon: Circle, color: 'text-emerald-500 bg-emerald-500' },
        { value: 'BUSY', label: 'Busy', icon: CircleDot, color: 'text-rose-500 bg-rose-500' },
        { value: 'OFFLINE', label: 'Invisible', icon: CircleDashed, color: 'text-slate-400 bg-slate-400' }
    ];

    const currentStatus = statuses.find(s => s.value === presence) || statuses[0];

    const handleSelect = async (newValue: string) => {
        setIsOpen(false);
        if (newValue === presence) return;
        
        setPresence(newValue);
        setIsUpdating(true);
        await updateUserPresence(newValue);
        setIsUpdating(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isUpdating}
                className="flex items-center gap-1.5 focus:outline-none relative group"
            >
                {/* Dot over user profile indicator */}
                <span className={cn("w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 absolute -top-1 -right-1 z-10 transition-colors", currentStatus.color.split(' ')[1])} />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-8" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                        <div className="px-3 pb-2 pt-1">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Set Status</p>
                        </div>
                        {statuses.map(status => (
                            <button
                                key={status.value}
                                onClick={() => handleSelect(status.value)}
                                className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <span className={cn("w-2.5 h-2.5 rounded-full", status.color.split(' ')[1])} />
                                    {status.label}
                                </span>
                                {presence === status.value && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
