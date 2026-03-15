import { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../lib/actions/notification';
import { Bell, CheckCircle2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { NotificationControls } from './notification-controls';

export default async function NotificationsPage() {
    const notifications = await getAllNotifications();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-500" />
                        Notifications
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View your recent notification history.
                    </p>
                </div>
                <NotificationControls />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No notifications yet</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">When you receive notifications, they will show up here.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {notifications.map((n) => {
                            const isRead = n.isRead;
                            
                            const Content = (
                                <div className={`p-4 sm:p-5 flex gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isRead ? 'opacity-70' : 'bg-indigo-50/30 dark:bg-indigo-500/5'}`}>
                                    <div className="mt-1 shrink-0">
                                        {isRead ? (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 relative">
                                                <Bell className="w-4 h-4" />
                                                <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                                            <h4 className={`text-base font-semibold ${isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleString(undefined, { 
                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            );

                            return (
                                <li key={n.id}>
                                    {n.linkUrl ? (
                                        <Link href={n.linkUrl} className="block">
                                            {Content}
                                        </Link>
                                    ) : (
                                        Content
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
