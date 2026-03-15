'use client';

import { useActionState, useState } from 'react';
import { createBug, findSimilarBugs } from '../../../lib/actions/bug';
import Link from 'next/link';

import { Sparkles, Search } from 'lucide-react';

type RelatedData = {
    builds: { id: string; version: string; projectId: string; project: { name: string } }[];
    modules: { id: string; name: string; projectId: string }[];
    subModules: { id: string; name: string; moduleId: string }[];
    developers: { id: string; name: string | null; email: string }[];
    groups: { id: string; name: string }[];
    managers: { id: string; name: string | null; email: string }[];
};

export default function BugForm({ builds, modules, subModules, developers, groups, managers }: RelatedData) {
    const initialState = { message: '', errors: {} };
    // @ts-ignore - Temporary bypass for action state complex union types
    const [state, formAction, isPending] = useActionState(createBug, initialState);

    // Find most recent build to use as default
    const mostRecentBuild = builds.length > 0 
        ? builds.sort((a, b) => b.version.localeCompare(a.version))[0] 
        : null;

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(mostRecentBuild ? mostRecentBuild.projectId : null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedBuildId, setSelectedBuildId] = useState<string>(mostRecentBuild ? mostRecentBuild.id : "");

    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Similarity Check State
    const [isCheckingSimilars, setIsCheckingSimilars] = useState(false);
    const [similarBugs, setSimilarBugs] = useState<{id: string, title: string, description: string | null}[] | null>(null);
    const [titleInput, setTitleInput] = useState("");
    const [descInput, setDescInput] = useState("");

    const handleCheckSimilars = async () => {
        if (!titleInput || !selectedModuleId) {
            alert("Please enter a Title and select a Module first.");
            return;
        }
        setIsCheckingSimilars(true);
        try {
            const res = await findSimilarBugs(titleInput, descInput, selectedModuleId);
            if (res.success) {
                setSimilarBugs(res.similarBugs || []);
            } else {
                alert(`Check failed: ${res.error}`);
            }
        } catch (e) {
            console.error("Failed to check similar bugs", e);
        } finally {
            setIsCheckingSimilars(false);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/analyze-bug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    context: `Available Modules (ID: Name):\n${modules.map(m => `${m.id}: ${m.name}`).join('\n')}\n` +
                             `Available Sub-Modules (ID: Name - parent Module ID):\n${subModules.map(sm => `${sm.id}: ${sm.name} - parent ${sm.moduleId}`).join('\n')}`
                })
            });
            const data = await res.json();
            if (res.ok && data) {
                const setExpected = document.getElementById('expectedResult') as HTMLTextAreaElement;
                const setActual = document.getElementById('actualResult') as HTMLTextAreaElement;
                const setSteps = document.getElementById('stepsToRepro') as HTMLTextAreaElement;
                const setSeverity = document.getElementById('severity') as HTMLSelectElement;

                if (data.title) setTitleInput(data.title);
                if (data.description) setDescInput(data.description);
                
                if (setExpected) setExpected.value = data.expectedResult || '';
                if (setActual) setActual.value = data.actualResult || '';
                if (setSteps) setSteps.value = data.stepsToRepro || '';
                if (setSeverity) setSeverity.value = data.severity || 'MEDIUM';

                if (data.moduleId) {
                    const module = modules.find(m => m.id === data.moduleId);
                    if (module) {
                        setSelectedProjectId(module.projectId);
                        setSelectedModuleId(data.moduleId);
                        
                        // Small timeout to allow React un-disable the options
                        setTimeout(() => {
                            const modSelect = document.getElementById('moduleId') as HTMLSelectElement;
                            if (modSelect) modSelect.value = data.moduleId;
                            
                            if (data.subModuleId) {
                                setTimeout(() => {
                                    const subSelect = document.getElementById('subModuleId') as HTMLSelectElement;
                                    if (subSelect) subSelect.value = data.subModuleId;
                                }, 50);
                            }
                        }, 50);
                    }
                }

            } else {
                alert(`AI Generation Failed: ${data.error || 'Unknown Error'}\n\nDetails: ${data.details || res.statusText}`);
            }
        } catch (e: any) {
            console.error("Failed to generate AI bug details", e);
            alert("Failed to connect to AI generation API. See console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const buildId = e.target.value;
        setSelectedBuildId(buildId);
        const build = builds.find(b => b.id === buildId);
        if (build) setSelectedProjectId(build.projectId);
        setSelectedModuleId(null);
    };

    const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModuleId(e.target.value);
    };

    const filteredModules = selectedProjectId ? modules.filter(m => m.projectId === selectedProjectId) : [];
    const filteredSubModules = selectedModuleId ? subModules.filter(sm => sm.moduleId === selectedModuleId) : [];

    return (
        <form action={formAction} className="space-y-8">
            {/* AI Auto-Fill Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-5">
                    <Sparkles className="w-24 h-24" />
                </div>
                <div className="relative">
                    <label htmlFor="aiPrompt" className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" /> Magic Auto-Fill
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <textarea
                            id="aiPrompt"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe the bug in plain English... (e.g. 'Login button loading state hangs forever on mobile view')"
                            className="flex-1 rounded-xl border-indigo-200 dark:border-indigo-700/50 bg-white/70 dark:bg-slate-900/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none placeholder:text-slate-400"
                            rows={2}
                        />
                        <button
                            type="button"
                            onClick={handleAiGenerate}
                            disabled={isGenerating || !aiPrompt}
                            className="whitespace-nowrap sm:self-end px-5 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
                        >
                            {isGenerating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Generate'}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-indigo-600/70 dark:text-indigo-400/70">
                        AI will automatically draft the Title, Expected/Actual Results, Severity, and Steps to Reproduce below.
                    </p>
                </div>
            </div>
            {/* Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                    <input type="text" id="title" name="title" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} required placeholder="Short, Descriptive Title" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all" />
                    {state?.errors?.title && <p className="mt-2 text-sm text-rose-500">{state.errors.title[0]}</p>}
                </div>

                <div>
                    <label htmlFor="buildId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Build</label>
                    <select id="buildId" name="buildId" required value={selectedBuildId} onChange={handleBuildChange} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none">
                        <option value="" disabled>Select the build you tested...</option>
                        {Array.from(new Set(builds.map(b => b.project.name))).sort().map(projectName => (
                            <optgroup key={projectName} label={projectName}>
                                {builds.filter(b => b.project.name === projectName)
                                    .sort((a, b) => b.version.localeCompare(a.version))
                                    .map(b => (
                                    <option key={b.id} value={b.id}>v{b.version}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    {state?.errors?.buildId && <p className="mt-2 text-sm text-rose-500">{state.errors.buildId[0]}</p>}
                    <p className="mt-1.5 text-xs text-slate-500">Choosing a build will automatically filter the modules below.</p>
                </div>

                <div>
                    <label htmlFor="moduleId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Module</label>
                    <select id="moduleId" name="moduleId" required onChange={handleModuleChange} disabled={!selectedProjectId} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none disabled:opacity-50" defaultValue="">
                        <option value="" disabled>Select a module...</option>
                        {filteredModules.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    {state?.errors?.moduleId && <p className="mt-2 text-sm text-rose-500">{state.errors.moduleId[0]}</p>}
                </div>

                <div>
                    <label htmlFor="subModuleId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sub-Module (Optional)</label>
                    <select id="subModuleId" name="subModuleId" disabled={!selectedModuleId || filteredSubModules.length === 0} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none disabled:opacity-50" defaultValue="">
                        <option value="">No specific sub-module</option>
                        {filteredSubModules.map(sm => (
                            <option key={sm.id} value={sm.id}>{sm.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="severity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Severity Level</label>
                    <select id="severity" name="severity" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none" defaultValue="MEDIUM">
                        <option value="CRITICAL">Critical (Blocks testing)</option>
                        <option value="HIGH">High (Major functionality broken)</option>
                        <option value="MEDIUM">Medium (Non-critical failure)</option>
                        <option value="LOW">Low (UI/UX issue, minor bug)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="assignTo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign To (Optional)</label>
                    <select id="assignTo" name="assignTo" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all appearance-none" defaultValue="">
                        <option value="">Leave Unassigned (Auto-Routes to Module Default)</option>
                        <optgroup label="Groups">
                            {groups.map(g => (
                                <option key={g.id} value={`group:${g.id}`}>{g.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Developers">
                            {developers.map(d => (
                                <option key={d.id} value={`dev:${d.id}`}>{d.name || d.email}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Project Managers">
                            {managers.map(m => (
                                <option key={m.id} value={`dev:${m.id}`}>{m.name || m.email}</option>
                            ))}
                        </optgroup>
                    </select>
                    <p className="mt-1.5 text-xs text-slate-500 break-words">If left unassigned, the system will automatically route this bug to the Group or Developer associated with the Project's Assignment Flow.</p>
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Reproduction Details */}
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Description (Optional)</label>
                        <button type="button" onClick={handleCheckSimilars} disabled={isCheckingSimilars || !selectedModuleId || !titleInput} className="text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium disabled:opacity-50">
                            {isCheckingSimilars ? <span className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                            Check for Duplicates
                        </button>
                    </div>
                    {similarBugs !== null && (
                        <div className="mb-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
                                {similarBugs.length > 0 ? "Potential Duplicates Found:" : "No highly similar open bugs found in this module."}
                            </h4>
                            {similarBugs.length > 0 && (
                                <ul className="space-y-2">
                                    {similarBugs.map(bug => (
                                        <li key={bug.id}>
                                            <Link href={`/admin/bugs/${bug.id}`} target="_blank" className="text-sm text-indigo-600 hover:underline flex items-start gap-2">
                                                <span className="mt-0.5">•</span> <span>{bug.title}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    <textarea id="description" name="description" value={descInput} onChange={(e) => setDescInput(e.target.value)} rows={4} placeholder="Describe the issue in detail..." className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="expectedResult" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expected Result</label>
                        <textarea id="expectedResult" name="expectedResult" required rows={3} placeholder="What should happen?" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none" />
                    </div>
                    <div>
                        <label htmlFor="actualResult" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Actual Result</label>
                        <textarea id="actualResult" name="actualResult" required rows={3} placeholder="What actually happened?" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none" />
                    </div>
                </div>

                <div>
                    <label htmlFor="stepsToRepro" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Steps to Reproduce</label>
                    <textarea id="stepsToRepro" name="stepsToRepro" rows={4} placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..." className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all resize-none font-mono text-xs" />
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Environment & Attachments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label htmlFor="environment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Environment (Browser, OS, Device)</label>
                    <input type="text" id="environment" name="environment" placeholder="e.g. Chrome 120, Windows 11, Desktop" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all" />
                </div>
                <div>
                    <label htmlFor="screenshot" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload Screenshot</label>
                    <input type="file" id="screenshot" name="screenshot" accept="image/*" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/50 cursor-pointer" />
                </div>
                <div>
                    <label htmlFor="video" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Upload Video Recording</label>
                    <input type="file" id="video" name="video" accept="video/*" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/50 cursor-pointer" />
                </div>
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
                    href="/admin/bugs"
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-70 flex items-center gap-2"
                >
                    {isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Report Bug'}
                </button>
            </div>
        </form>
    );
}
