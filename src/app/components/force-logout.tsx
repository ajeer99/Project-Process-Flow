'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

export function ForceLogout() {
    useEffect(() => {
        // Clear the client-side session and redirect to login
        signOut({ callbackUrl: '/login' });
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center max-w-sm w-full">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Session Expired</h2>
                <p className="text-sm text-slate-500 text-center">Your access was revoked or your password was changed. Redirecting to login...</p>
            </div>
        </div>
    );
}
