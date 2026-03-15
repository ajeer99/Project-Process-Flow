import { auth, signOut } from '../../../auth';
import { LogOut } from 'lucide-react';
import { NotificationBell } from '../components/notification-bell';
import { UserPresenceToggle } from '../components/user-presence-toggle';
import { UserAvatar } from './components/user-avatar';
import prisma from '@/app/lib/prisma';

export default async function Header() {
    const session = await auth();
    let presence = 'ONLINE';
    let userData = null;
    if (session?.user?.id) {
        userData = await prisma.user.findUnique({ 
            where: { id: session.user.id }, 
            select: { presence: true, avatarUrl: true, name: true, email: true }
        });
        if (userData) presence = userData.presence;
    }
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <NotificationBell />
                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-800" aria-hidden="true" />
                    {/* Profile */}
                    <div className="flex items-center gap-x-4">
                        <span className="hidden lg:flex items-center gap-3 text-sm font-medium leading-6 text-gray-900 dark:text-white">
                            <div className="relative flex items-center justify-center">
                                <UserAvatar 
                                    src={userData?.avatarUrl} 
                                    name={userData?.name} 
                                    email={userData?.email || session?.user?.email} 
                                    size={36} 
                                    className="border-indigo-200 dark:border-indigo-800"
                                />
                                <div className="absolute top-0 -right-1 z-10">
                                    <UserPresenceToggle initialPresence={presence} />
                                </div>
                            </div>
                            <span aria-hidden="true">{userData?.name || session?.user?.email}</span>
                        </span>
                        <form
                            action={async () => {
                                'use server';
                                await signOut({ redirectTo: '/login' });
                            }}
                        >
                            <button
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                title="Sign out"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="sr-only lg:not-sr-only">Sign out</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    );
}
