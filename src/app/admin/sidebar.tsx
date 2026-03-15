'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Package, Bug, Settings, Menu, X, GitPullRequestDraft, Users, MessageSquare, Code2, TestTube2, Pin, PinOff, Briefcase, BookOpen, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { getAppSettings } from '../lib/actions/app-settings';

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { name: 'Modules', href: '/admin/modules', icon: Package },
    { name: 'Builds', href: '/admin/builds', icon: GitPullRequestDraft },
    { name: 'Bugs', href: '/admin/bugs', icon: Bug },
    { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
    { name: 'Team', href: '/admin/users', icon: Users },
    { name: 'Reports', href: '/admin/reports/project-summary', icon: BarChart2 },
    { name: 'Docs', href: '/admin/docs', icon: BookOpen },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar({ className, role, canViewReports = false }: { className?: string; role?: string, canViewReports?: boolean }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    
    const [appName, setAppName] = useState('QA Portal');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        getAppSettings().then(res => {
            if (res.success && res.settings) {
                setAppName(res.settings.appName);
                setLogoUrl(res.settings.logoUrl || null);
            }
        });
    }, []);

    let navItems = [...navigation];
    
    // Filter/add navigation based on role
    if (role === 'ADMIN') {
        navItems.splice(1, 0, 
            { name: 'Workspace', href: '/admin/workspace', icon: Briefcase }
        );
    } else if (role === 'DEVELOPER') {
        navItems = [
            { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Workspace', href: '/admin/workspace', icon: Briefcase },
            { name: 'Bugs', href: '/admin/bugs', icon: Bug },
            { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
            ...(canViewReports ? [{ name: 'Reports', href: '/admin/reports/performance', icon: BarChart2 }] : []),
            { name: 'Docs', href: '/admin/docs', icon: BookOpen },
            { name: 'Settings', href: '/admin/settings', icon: Settings }
        ];
    } else if (role === 'PROJECT_MANAGER') {
        navItems = [
            { name: 'Dashboard', href: '/admin/workspace/manager', icon: LayoutDashboard },
            { name: 'Workspace', href: '/admin/workspace', icon: Briefcase },
            { name: 'Assigned Projects', href: '/admin/projects', icon: FolderKanban },
            { name: 'Builds', href: '/admin/builds', icon: GitPullRequestDraft },
            { name: 'Bugs', href: '/admin/bugs', icon: Bug },
            { name: 'Team', href: '/admin/users', icon: Users },
            { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
            ...(canViewReports ? [{ name: 'Reports', href: '/admin/reports/project-summary', icon: BarChart2 }] : []),
            { name: 'Docs', href: '/admin/docs', icon: BookOpen },
            { name: 'Settings', href: '/admin/settings', icon: Settings }
        ];
    } else if (role === 'TESTER') {
        navItems = [
            { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Workspace', href: '/admin/workspace', icon: Briefcase },
            { name: 'Bugs', href: '/admin/bugs', icon: Bug },
            { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
            ...(canViewReports ? [{ name: 'Reports', href: '/admin/reports/performance', icon: BarChart2 }] : []),
            { name: 'Docs', href: '/admin/docs', icon: BookOpen },
            { name: 'Settings', href: '/admin/settings', icon: Settings }
        ];
    }

    return (
        <>
            {/* Mobile Header Menu Button */}
            <div className="lg:hidden fixed top-0 left-0 flex items-center h-16 px-4 z-50 pointer-events-auto">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 mr-4 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm border border-gray-200 dark:border-gray-800"
                >
                    {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
                </button>
                <div className="font-semibold text-lg text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">{appName}</div>
            </div>

            {/* Sidebar Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden pointer-events-auto"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out lg:static lg:inset-auto pointer-events-auto",
                isOpen ? "translate-x-0 w-72" : cn("-translate-x-full lg:translate-x-0", isPinned ? "w-72" : "w-[80px] lg:hover:w-72"),
                "group overflow-hidden",
                className
            )}>
                <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800 overflow-hidden whitespace-nowrap">
                    <div className="flex items-center gap-4">
                        {logoUrl ? (
                            <img src={logoUrl} alt={appName} className="w-8 h-8 object-contain shrink-0" />
                        ) : (
                            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Bug className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <span className={cn(
                            "text-xl font-bold tracking-tight text-slate-800 dark:text-white transition-opacity duration-300",
                            isOpen || isPinned ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"
                        )}>{appName}</span>
                    </div>
                    <button 
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                            "hidden lg:flex p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-300 ms-2",
                            isOpen || isPinned ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"
                        )}
                        title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                    >
                        {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                </div>
                <nav className="flex flex-1 flex-col mt-6 px-4 overflow-x-hidden overflow-y-auto">
                    <ul role="list" className="flex flex-1 flex-col gap-y-2">
                        {navItems.map((item) => {
                            const isCurrent = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={item.name}
                                        className={cn(
                                            isCurrent
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50',
                                            'flex items-center gap-x-4 rounded-xl p-3 text-sm leading-6 transition-all duration-200 overflow-hidden whitespace-nowrap'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                                                'h-6 w-6 shrink-0 transition-colors'
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className={cn(
                                            "transition-opacity duration-300",
                                            isOpen || isPinned ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"
                                        )}>{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </>
    );
}
