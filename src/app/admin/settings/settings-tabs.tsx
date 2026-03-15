'use client';

import { useState } from 'react';
import { User, Settings, Workflow } from 'lucide-react';
import { cn } from '../../lib/utils';

type Tab = {
    id: string;
    label: string;
    icon: React.ReactNode;
    content: React.ReactNode;
};

export default function SettingsTabs({ tabs }: { tabs: Tab[] }) {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <div className="space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    isActive
                                        ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300',
                                    'group flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
                                )}
                            >
                                <span className={cn(
                                    "mr-2",
                                    isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                                )}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-8">
                {tabs.find((t) => t.id === activeTab)?.content}
            </div>
        </div>
    );
}
