'use client';

import { Printer, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationControls() {
    const router = useRouter();

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
            </button>
        </div>
    );
}
