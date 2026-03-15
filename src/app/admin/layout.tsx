import Header from './header';
import { Sidebar } from './sidebar';
import { auth } from '../../../auth';
import { GlobalChatWidget } from '../components/global-chat-widget';
import { ChatNotifier } from '../components/chat-notifier';
import { ForceLogout } from '../components/force-logout';
import prisma from '@/app/lib/prisma';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if ((session as any)?.error === 'Revoked') {
        return <ForceLogout />;
    }

    let canViewReports = false;
    if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { canViewReports: true }
        });
        canViewReports = dbUser?.canViewReports || false;
    }

    return (
        <div className="flex bg-slate-50 dark:bg-black min-h-screen text-slate-900 dark:text-slate-100 font-sans print:bg-white print:text-black">
            <div className="print:hidden lg:h-screen lg:sticky lg:top-0 z-50 w-0 h-0 lg:w-auto lg:h-auto pointer-events-none lg:pointer-events-auto overflow-visible">
                <Sidebar role={(session?.user as any)?.role as string | undefined} canViewReports={canViewReports} />
            </div>
            <div className="flex flex-col flex-1 min-w-0 bg-white/50 dark:bg-white/[0.02] print:bg-white w-full">
                <div className="print:hidden w-full sticky top-0 z-30">
                    <Header />
                </div>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full overflow-x-hidden print:p-0">
                    {children}
                </main>
            </div>
            {session?.user?.id && (
                <div className="print:hidden">
                    <GlobalChatWidget currentUserId={session.user.id} />
                    <ChatNotifier />
                </div>
            )}
        </div>
    );
}
