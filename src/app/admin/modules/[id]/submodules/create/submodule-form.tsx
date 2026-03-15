'use client';

import { useActionState } from 'react';
import { createSubModule } from '../../../../../lib/actions/submodule';
import { updateModule, updateSubModule } from '../../../../../lib/actions/settings';
import { EditableInlineField } from '../../../create/module-form';
import Link from 'next/link';

export default function SubModuleForm({ moduleId, moduleName, subModules }: { moduleId: string, moduleName: string, subModules: any[] }) {
    const initialState = { message: '', errors: {} };
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [state, formAction, isPending] = useActionState(createSubModule, initialState);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <form action={formAction} className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                    Add Sub-Module
                </h2>
                <input type="hidden" name="moduleId" value={moduleId} />

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Sub-Module Name (e.g., Customer, Invoice, Payment)
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        autoFocus
                        placeholder="Enter feature component name..."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                    />
                    {state?.errors?.name && state.errors.name.map((error: string) => (
                        <p className="mt-2 text-sm text-rose-500" key={error}>{error}</p>
                    ))}
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
                        {isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Component'}
                    </button>
                </div>
            </form>

            {/* Inline Editor for the Parent Module & Existing Submodules */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Manage <EditableInlineField initialValue={moduleName} onSave={(val: string) => updateModule(moduleId, val)} />
                    </h2>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-800 max-h-[500px] overflow-y-auto">
                   {subModules.length === 0 ? (
                       <p className="text-sm text-slate-500 text-center py-6">No sub-modules defined yet.</p>
                   ) : (
                       <ul className="space-y-3">
                           {subModules.map(sm => (
                               <li key={sm.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                                   <div className="flex flex-col gap-1">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-2">Sub-Module ID: <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-500">{sm.id.substring(0, 8)}</span></p>
                                        <EditableInlineField initialValue={sm.name} onSave={(val: string) => updateSubModule(sm.id, val)} />
                                   </div>
                               </li>
                           ))}
                       </ul>
                   )}
                </div>
                <p className="text-xs text-slate-500">
                    You can edit the Parent Module Name or any of its Sub-Modules directly by clicking the pencil icon next to their names.
                </p>
            </div>
        </div>
    );
}
