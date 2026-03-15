import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import SettingsForm from './settings-form';
import { SmtpSettingsForm } from './smtp-settings-form';
import { SystemSettingsForm } from './system-settings-form';
import SettingsTabs from './settings-tabs';
import { User, Settings, Mail, History } from 'lucide-react';
import prisma from '@/app/lib/prisma';
import EmailLogsTable from './email-logs-table';
import ActionLogsTable from './action-logs-table';

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { notificationsEnabled: true, email: true, name: true, role: true, avatarUrl: true }
    });

    if (!user) redirect('/login');

    const tabs = [
        {
            id: 'profile',
            label: 'Profile & Account',
            icon: <User className="w-5 h-5" />,
            content: <SettingsForm initialData={user} userId={session.user.id} />
        }
    ];

    if (user.role === 'ADMIN') {
        tabs.push({
            id: 'system',
            label: 'System Config',
            icon: <Settings className="w-5 h-5" />,
            content: (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">SMTP Settings</h2>
                    <SmtpSettingsForm />
                    <SystemSettingsForm />
                </div>
            )
        });
        
        tabs.push({
            id: 'email-logs',
            label: 'Email Logs',
            icon: <Mail className="w-5 h-5" />,
            content: (
                <EmailLogsTable />
            )
        });

        tabs.push({
            id: 'action-logs',
            label: 'Action Logs',
            icon: <History className="w-5 h-5" />,
            content: (
                <ActionLogsTable />
            )
        });
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your user profile, routing logic, and system configurations.</p>
            </div>

            <SettingsTabs tabs={tabs} />
        </div>
    );
}
