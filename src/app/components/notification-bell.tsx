'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/actions/notification';
import Link from 'next/link';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;
        const fetchNotifs = async () => {
            const data = await getUnreadNotifications();
            if (mounted) {
                setNotifications(data);
                setLoading(false);
            }
        };

        fetchNotifs();
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 15000); // Poll every 15s to be more responsive
        
        const handleRefresh = () => {
            fetchNotifs();
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener('notification:refresh', handleRefresh);
        }
        
        return () => {
            mounted = false;
            clearInterval(interval);
            if (typeof window !== 'undefined') {
                window.removeEventListener('notification:refresh', handleRefresh);
            }
        };
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic UI update: Remove it entirely from the unread list
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        await markNotificationAsRead(id);
    };

    const handleClearAll = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic update: empty the list
        setNotifications([]);
        await markAllNotificationsAsRead();
    };

    const unreadCount = notifications.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
            >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[400px]">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                            <div className="flex items-center gap-3">
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleClearAll}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                                <span className={unreadCount > 0 ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium" : "bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full"}>
                                    {unreadCount} Unread
                                </span>
                            </div>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                            ) : unreadCount === 0 ? (
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">You are all caught up!</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {notifications.map(n => {
                                        const Content = (
                                            <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 relative group">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{n.title}</p>
                                                        <span className="w-2 h-2 mt-1.5 shrink-0 bg-indigo-500 rounded-full"></span>
                                                    </div>
                                                    <p className="text-xs line-clamp-2 mt-0.5 text-slate-600 dark:text-slate-300">{n.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleMarkAsRead(n.id, e)}
                                                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 shrink-0 opacity-0 group-hover:opacity-100 transition-all absolute right-4 top-1/2 -translate-y-1/2"
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );

                                        return n.linkUrl ? (
                                            <li key={n.id}>
                                                <Link href={n.linkUrl} onClick={() => setIsOpen(false)}>
                                                    {Content}
                                                </Link>
                                            </li>
                                        ) : (
                                            <li key={n.id}>{Content}</li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/20">
                            <Link 
                                href="/admin/notifications" 
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                View all notifications
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
