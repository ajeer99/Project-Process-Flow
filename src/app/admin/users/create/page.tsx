import { ArrowLeft, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { auth } from '../../../../../auth';
import { CreateUserForm } from './create-user-form';
import { redirect } from 'next/navigation';

export default async function CreateUserPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');
    const currentUserRole = (session.user as any).role as string;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users"
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserIcon className="w-6 h-6 text-indigo-500" />
                        Create New User
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Add a new administrator, developer, or tester to the system.
                    </p>
                </div>
            </div>

            <CreateUserForm currentUserRole={currentUserRole} />
        </div>
    );
}
