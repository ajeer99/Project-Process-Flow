import { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '../../../../auth';

export const metadata: Metadata = {
    title: 'Reports | QA Portal',
    description: 'Project and Bug reporting analytics.',
};

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full print:space-y-0">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reporting Module</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">High-level analytics and granular performance metrics for your projects.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
                <div className="border-b border-slate-200 dark:border-slate-800 print:hidden">
                    <nav className="flex overflow-x-auto whitespace-nowrap p-1">
                        <Link 
                            href="/admin/reports/project-summary"
                            className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                        >
                            Project Summary
                        </Link>
                        <Link 
                            href="/admin/reports/lifecycle"
                            className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                        >
                            Bug Lifecycle
                        </Link>
                        <Link 
                            href="/admin/reports/performance"
                            className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                        >
                            Performance
                        </Link>
                        <Link 
                            href="/admin/reports/time-tracking"
                            className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                        >
                            Time Tracking
                        </Link>
                        {session?.user?.role === 'ADMIN' && (
                            <Link 
                                href="/admin/reports/user-activity"
                                className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                            >
                                User Activity Tracker
                            </Link>
                        )}
                        {session?.user?.role === 'ADMIN' && (
                            <Link 
                                href="/admin/reports/audit-log"
                                className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-colors"
                            >
                                System Audit Log
                            </Link>
                        )}
                    </nav>
                </div>
                <div className="p-6 print:p-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
