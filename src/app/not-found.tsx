import Link from 'next/link';
import { Home, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="p-8 text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-6xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                        404
                    </h1>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Oops! The page you're looking for doesn't exist, has been removed, or is temporarily unavailable.
                    </p>
                </div>

                <div className="p-8 space-y-4">
                    <Link
                        href="/admin/dashboard"
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98]"
                    >
                        <Home className="w-5 h-5" />
                        Back to Dashboard
                    </Link>
                    <button 
                        onClick={() => window.history.back()}
                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.98]"
                    >
                        Go Back Previous Page
                    </button>
                </div>
                
                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        Error Code: NOT_FOUND_404
                    </p>
                </div>
            </div>
        </div>
    );
}
