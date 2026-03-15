'use client';

import { useState } from 'react';
import { deleteModule } from '../../lib/actions/module';
import { updateModule } from '../../lib/actions/settings';
import { Trash2, Package, Plus, Edit2, Check, X, Loader2, Activity } from 'lucide-react';
import Link from 'next/link';

export function ModuleCard({ mod }: { mod: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(mod.name);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (name === mod.name) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        const res = await updateModule(mod.id, name);
        setIsSaving(false);
        if (res?.error) {
            alert("Error: " + res.error);
        } else {
            setIsEditing(false);
        }
    };

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all flex flex-col min-h-[160px]">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Package className="w-5 h-5" />
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Edit Module">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <form action={async () => { await deleteModule(mod.id); }}>
                            <button type="submit" className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Delete Module">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <div className="mb-4 space-y-3 flex-1">
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            disabled={isSaving}
                            className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <button onClick={handleSave} disabled={isSaving} className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setIsEditing(false); setName(mod.name); }} disabled={isSaving} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">{mod.name}</h3>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="max-w-[150px] truncate" title={mod.project.name}>Project: {mod.project.name}</span>
                </div>
                
                {mod.subModules && mod.subModules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {mod.subModules.map((sm: any) => (
                            <span key={sm.id} className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-400/10 dark:text-slate-400 dark:ring-slate-400/20">{sm.name}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
                <div className="flex flex-col gap-1 -ml-2">
                    <Link href={`/admin/projects/${mod.projectId}/modules/${mod.id}/analytics`} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-2 py-1.5 rounded-lg transition-colors">
                        <Activity className="w-3.5 h-3.5" /> Analytics
                    </Link>
                    <Link href={`/admin/modules/${mod.id}/submodules/create`} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-xs flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1.5 rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Sub-Module
                    </Link>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs">
                    {mod._count.bugs} bugs tracked
                </span>
            </div>
        </div>
    );
}
