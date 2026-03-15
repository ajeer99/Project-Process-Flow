'use client';

import { useActionState } from 'react';
import { createProject } from '../../../lib/actions/project';
import Link from 'next/link';

export default function ProjectForm({ managers }: { managers: { id: string, name: string }[] }) {
    const initialState = { message: '', errors: {} };
    const [state, formAction, isPending] = useActionState(createProject, initialState);

    return (
        <form action={formAction} className="space-y-6">
            {/* Project Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="e.g. ERP POS System"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                    aria-describedby="name-error"
                />
                <div id="name-error" aria-live="polite" aria-atomic="true">
                    {state?.errors?.name &&
                        state.errors.name.map((error: string) => (
                            <p className="mt-2 text-sm text-rose-500" key={error}>
                                {error}
                            </p>
                        ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description (Optional)
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Brief description of the project scope..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none"
                    aria-describedby="description-error"
                />
            </div>

            {/* Status */}
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Initial Status
                </label>
                <select
                    id="status"
                    name="status"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none"
                >
                    <option value="ACTIVE">Active</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* Project Manager */}
            <div>
                <label htmlFor="managerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Assign Project Manager (Optional)
                </label>
                <select
                    id="managerId"
                    name="managerId"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none"
                >
                    <option value="">-- Unassigned --</option>
                    {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                    ))}
                </select>
            </div>


            {/* Global Errors */}
            <div aria-live="polite" aria-atomic="true">
                {state?.message && (
                    <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-200 dark:border-rose-500/20">
                        {state.message}
                    </p>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                    href="/admin/projects"
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-70 flex items-center gap-2"
                >
                    {isPending ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Create Project'
                    )}
                </button>
            </div>
        </form>
    );
}
