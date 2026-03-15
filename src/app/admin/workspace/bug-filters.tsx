'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

interface FilterOption {
    id: string;
    name: string;
}

interface BugFiltersProps {
    projects: (FilterOption & { 
        modules: (FilterOption & { 
            subModules: FilterOption[] 
        })[] 
    })[];
}

export function BugFilters({ projects }: BugFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Current selections from URL
    const projectId = searchParams.get('projectId') || '';
    const moduleId = searchParams.get('moduleId') || '';
    const subModuleId = searchParams.get('subModuleId') || '';

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            
            // If project changes, clear module and submodule
            if (name === 'projectId') {
                params.delete('moduleId');
                params.delete('subModuleId');
            }
            // If module changes, clear submodule
            if (name === 'moduleId') {
                params.delete('subModuleId');
            }

            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = (name: string, value: string) => {
        router.push(`?${createQueryString(name, value)}`);
    };

    const selectedProject = projects.find(p => p.id === projectId);
    const selectedModule = selectedProject?.modules.find(m => m.id === moduleId);

    return (
        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-wrap lg:flex-nowrap">
            <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Project</label>
                <select
                    value={projectId}
                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px]"
                >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Module</label>
                <select
                    value={moduleId}
                    onChange={(e) => handleFilterChange('moduleId', e.target.value)}
                    disabled={!projectId}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px] disabled:opacity-50"
                >
                    <option value="">All Modules</option>
                    {selectedProject?.modules.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sub-Module</label>
                <select
                    value={subModuleId}
                    onChange={(e) => handleFilterChange('subModuleId', e.target.value)}
                    disabled={!moduleId}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px] disabled:opacity-50"
                >
                    <option value="">All Sub-Modules</option>
                    {selectedModule?.subModules.map(sm => (
                        <option key={sm.id} value={sm.id}>{sm.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sort By</label>
                <select
                    value={searchParams.get('sort') || 'newest'}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border-none outline-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px]"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>
            
            {(projectId || moduleId || subModuleId) && (
                <div className="flex items-end pb-1.5">
                    <button 
                        onClick={() => router.push('?')}
                        className="text-sm font-medium text-rose-500 hover:text-rose-600 px-3 py-1.5"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}
