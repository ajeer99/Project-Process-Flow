'use client';

import { useActionState } from 'react';
import { createBuild } from '../../../lib/actions/build';
import Link from 'next/link';

type Project = { id: string; name: string };

export default function BuildForm({ projects }: { projects: Project[] }) {
    const initialState = { message: '', errors: {} };
    const [state, formAction, isPending] = useActionState(createBuild, initialState);

    return (
        <form action={formAction} className="space-y-6">
            <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project
                </label>
                <select
                    id="projectId"
                    name="projectId"
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none"
                    aria-describedby="project-error"
                >
                    <option value="" disabled>Select the project...</option>
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                </select>
                <div id="project-error" aria-live="polite" aria-atomic="true">
                    {state?.errors?.projectId &&
                        state.errors.projectId.map((error: string) => (
                            <p className="mt-2 text-sm text-rose-500" key={error}>
                                {error}
                            </p>
                        ))}
                </div>
            </div>

            <div>
                <label htmlFor="version" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Build Version
                </label>
                <input
                    type="text"
                    id="version"
                    name="version"
                    placeholder="e.g. 1.0.4-rc2"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                    aria-describedby="version-error"
                />
                <div id="version-error" aria-live="polite" aria-atomic="true">
                    {state?.errors?.version &&
                        state.errors.version.map((error: string) => (
                            <p className="mt-2 text-sm text-rose-500" key={error}>
                                {error}
                            </p>
                        ))}
                </div>
            </div>

            <div>
                <label htmlFor="releaseNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Release Notes / Changes
                </label>
                <textarea
                    id="releaseNotes"
                    name="releaseNotes"
                    rows={6}
                    placeholder="Describe what has been delivered in this build (e.g. Fixed login bug, added new dashboard widgets)..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none"
                />
            </div>

            <div aria-live="polite" aria-atomic="true">
                {state?.message && (
                    <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-200 dark:border-rose-500/20">
                        {state.message}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                    href="/admin/builds"
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
                        'Deliver Build'
                    )}
                </button>
            </div>
        </form>
    );
}
