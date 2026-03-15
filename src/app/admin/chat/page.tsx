import { auth } from '../../../../auth';
import { getChatUsers } from '../../lib/actions/chat';
import { redirect } from 'next/navigation';
import { ChatLayout } from './chat-layout';

export default async function ChatPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const result = await getChatUsers();
    const users = result.success ? result.users : [];

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex flex-col gap-1 mb-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Direct Messages</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Chat with members of your team.</p>
            </div>
            
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex min-h-0 relative">
                <ChatLayout users={users} currentUserId={session.user.id} />
            </div>
        </div>
    );
}
