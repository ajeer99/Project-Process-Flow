'use client';

import { useActionState, useState } from 'react';
import { createModule } from '../../../lib/actions/module';
import { updateModule, updateSubModule } from '../../../lib/actions/settings';
import { Check, Edit2, X, Plus } from 'lucide-react';
import Link from 'next/link';

type Project = { id: string; name: string; };

export function EditableInlineField({ initialValue, onSave, label }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if(value === initialValue) { setIsEditing(false); return; }
        setIsSaving(true);
        const res = await onSave(value);
        setIsSaving(false);
        if(res?.error) {
            alert("Error: " + res.error);
        } else {
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 min-w-[120px] rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSave();
                        }
                    }}
                />
                <button type="button" onClick={handleSave} disabled={isSaving} className="text-emerald-600 hover:text-emerald-700 p-1">
                    {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => { setIsEditing(false); setValue(initialValue); }} disabled={isSaving} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <span className="text-sm text-slate-900 dark:text-white truncate" title={label || initialValue}>{initialValue || <span className="text-slate-400 italic">Empty</span>}</span>
            <button type="button" onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 transition-opacity">
                <Edit2 className="w-3 h-3" />
            </button>
        </div>
    );
}

export default function ModuleForm({ projects, initialSubModules }: { projects: Project[], initialSubModules: any[] }) {
    const initialState = { message: '', errors: {} };
    // @ts-ignore
    const [state, formAction, isPending] = useActionState(createModule, initialState);
    
    // We only display sub-modules, they are created in the submodule page, but edited inline here
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Create New Module Form */}
            <form action={formAction} className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                    Add New Module
                </h2>
                <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Assign to Project
                    </label>
                    <select
                        id="projectId"
                        name="projectId"
                        defaultValue=""
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none"
                    >
                        <option value="" disabled>Select a project...</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Module Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="e.g. Authentication, Shopping Cart"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                    />
                </div>

                {state?.message && (
                    <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-200 dark:border-rose-500/20">
                        {state.message}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Module'}
                    </button>
                </div>
            </form>

            {/* Inline Editor for Existing Modules/Sub-modules */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Existing Sub-Modules
                    </h2>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-800 max-h-[500px] overflow-y-auto">
                   {initialSubModules.length === 0 ? (
                       <p className="text-sm text-slate-500 text-center py-6">No sub-modules defined yet.</p>
                   ) : (
                       <ul className="space-y-3">
                           {initialSubModules.map(sm => (
                               <li key={sm.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                                   <div className="flex flex-col gap-1">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">Sub-Module <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-500">{sm.moduleId}</span></p>
                                        <EditableInlineField initialValue={sm.name} onSave={(val: string) => updateSubModule(sm.id, val)} />
                                   </div>
                               </li>
                           ))}
                       </ul>
                   )}
                </div>
                <p className="text-xs text-slate-500">
                    You can edit existing sub-modules directly from this list by hovering over their names and clicking the pencil icon. To create a new Sub-Module, go back to the Modules list and click "+ Sub-Module" on a specific Module card.
                </p>
            </div>
        </div>
    );
}
