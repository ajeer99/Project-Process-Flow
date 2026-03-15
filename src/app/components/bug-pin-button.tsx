'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { toggleBugPin } from '../lib/actions/bug';
import { cn } from '../lib/utils';
import { useRouter } from 'next/navigation';

interface BugPinButtonProps {
    bugId: string;
    initialPinned: boolean;
}

export function BugPinButton({ bugId, initialPinned }: BugPinButtonProps) {
    const [isPinned, setIsPinned] = useState(initialPinned);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        setLoading(true);
        // Optimistic update
        setIsPinned(!isPinned);
        const res = await toggleBugPin(bugId, initialPinned);
        if (!res.success) {
            setIsPinned(initialPinned); // Revert on failure
        } else {
            router.refresh(); // Refresh page data
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={cn(
                "p-2 rounded-xl transition-all border flex items-center justify-center shadow-sm disabled:opacity-50",
                isPinned 
                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-500 border-amber-200 dark:border-amber-500/30 hover:bg-amber-200 dark:hover:bg-amber-500/30" 
                    : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            )}
            title={isPinned ? "Unpin Bug" : "Pin to Top"}
        >
            <Star className={cn("w-5 h-5", isPinned ? "fill-amber-500" : "")} />
        </button>
    );
}
