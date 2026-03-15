'use client';

import { useState } from 'react';
import { createAssignmentFlow, deleteAssignmentFlow } from '../../lib/actions/flows';
import { Loader2, Trash2, GitMerge } from 'lucide-react';

type Flow = {
    id: string;
    project: { name: string };
    developer: { name: string | null; email: string } | null;
    tester: { name: string | null; email: string } | null;
    developerGroup?: { name: string } | null;
    testerGroup?: { name: string } | null;
};

export default function AssignmentFlowsForm({
    projects,
    developers,
    testers,
    groups = [],
    flows
}: {
    projects: { id: string; name: string }[];
    developers: { id: string; name: string | null; email: string }[];
    testers: { id: string; name: string | null; email: string }[];
    groups?: { id: string; name: string; type: string }[];
    flows: Flow[];
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const result = await createAssignmentFlow(null, formData);
        if (result?.message && !result.success) {
            alert(result.message);
        }
        setIsSubmitting(false);
        (e.target as HTMLFormElement).reset();
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        await deleteAssignmentFlow(id);
        setDeletingId(null);
    };

    return (
        <div className="space-y-8">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6">
                 <div className="flex items-start gap-4 inline-flex">
                     <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg shrink-0">
                         <GitMerge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                     </div>
                     <div>
                         <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Project Auto-Routing</h3>
                         <p className="text-sm text-indigo-700/80 dark:text-indigo-300 mt-1">
                             Map a Project to a specific Developer and QA Tester. Whenever a bug is logged for this project, it will automatically bypass the Unassigned Backlog and be routed directly to them. Standard users cannot override these configured assignments.
                         </p>
                     </div>
                 </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Create New Flow</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Project</label>
                        <select
                            id="projectId"
                            name="projectId"
                            required
                            disabled={isSubmitting}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        >
                            <option value="">Select Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="developerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assign Developer</label>
                        <select
                            id="developerId"
                            name="developerId"
                            required
                            disabled={isSubmitting}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        >
                            <option value="">Select Developer</option>
                            <optgroup label="Groups">
                                {groups?.filter(g => g.type === 'DEVELOPER').map(g => (
                                    <option key={g.id} value={`group:${g.id}`}>{g.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Individuals">
                                {developers.map(d => <option key={d.id} value={`user:${d.id}`}>{d.name || d.email}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="testerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assign QA Tester</label>
                        <select
                            id="testerId"
                            name="testerId"
                            required
                            disabled={isSubmitting}
                            className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        >
                            <option value="">Select Tester</option>
                            <optgroup label="Groups">
                                {groups?.filter(g => g.type === 'TESTER').map(g => (
                                    <option key={g.id} value={`group:${g.id}`}>{g.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Individuals">
                                {testers.map(t => <option key={t.id} value={`user:${t.id}`}>{t.name || t.email}</option>)}
                            </optgroup>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Flow
                    </button>
                </div>
            </form>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Assignment Flows</h3>
                </div>
                {flows.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        No assignment flows configured. Bugs will go to the global unassigned backlog.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {flows.map(flow => (
                            <div key={flow.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="space-y-1 text-sm">
                                    <h4 className="font-bold text-slate-900 dark:text-white">{flow.project.name}</h4>
                                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                                        <span>Dev: <strong className="text-slate-700 dark:text-slate-300">{flow.developer?.name || flow.developer?.email || flow.developerGroup?.name || 'Unassigned'}</strong></span>
                                        <span>QA: <strong className="text-slate-700 dark:text-slate-300">{flow.tester?.name || flow.tester?.email || flow.testerGroup?.name || 'Unassigned'}</strong></span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(flow.id)}
                                    disabled={deletingId === flow.id}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete Flow"
                                >
                                    {deletingId === flow.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
