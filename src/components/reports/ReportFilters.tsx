'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Filter } from 'lucide-react';

export interface ExtraFilterOption {
    value: string;
    label: string;
}

export interface ExtraFilter {
    id: string;
    label: string;
    options: ExtraFilterOption[];
}

interface ReportFiltersProps {
    projects: { id: string, name: string }[];
    extraFilters?: ExtraFilter[];
    hideProjectFilter?: boolean;
    hideDateFilters?: boolean;
}

export function ReportFilters({ projects, extraFilters, hideProjectFilter, hideDateFilters }: ReportFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [projectId, setProjectId] = useState(searchParams.get('projectId') || 'all');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [extraValues, setExtraValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        extraFilters?.forEach(f => {
            init[f.id] = searchParams.get(f.id) || 'all';
        });
        return init;
    });

    const handleApply = () => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        
        if (projectId !== 'all') params.set('projectId', projectId);
        else params.delete('projectId');
        
        if (startDate) params.set('startDate', startDate);
        else params.delete('startDate');
        
        if (endDate) params.set('endDate', endDate);
        else params.delete('endDate');

        if (extraFilters) {
            extraFilters.forEach(f => {
                if (extraValues[f.id] && extraValues[f.id] !== 'all') {
                    params.set(f.id, extraValues[f.id]);
                } else {
                    params.delete(f.id);
                }
            });
        }
        
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {!hideProjectFilter && (
                <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
            
            {!hideDateFilters && (
                <>
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                    </div>
                </>
            )}
            
            {extraFilters?.map(filter => (
                <div key={filter.id} className="flex-1 w-full sm:w-auto">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{filter.label}</label>
                    <select
                        value={extraValues[filter.id]}
                        onChange={(e) => setExtraValues(prev => ({ ...prev, [filter.id]: e.target.value }))}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                        <option value="all">Any {filter.label}</option>
                        {filter.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            ))}
            
            <button
                onClick={handleApply}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
                Apply Filters
            </button>
        </div>
    );
}
