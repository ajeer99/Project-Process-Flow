'use client';

import { useState } from 'react';
import { manageProjectAssignmentFlow } from '@/app/lib/actions/flows';
import { GitMerge, Users, Save, X, Settings2, Loader2 } from 'lucide-react';

export function ConfigAutoAssignment({ 
    projectId, 
    currentFlow, 
    developers, 
    testers, 
    groups = [],
    canEdit 
}: { 
    projectId: string; 
    currentFlow: any; 
    developers: any[]; 
    testers: any[]; 
    groups?: any[];
    canEdit: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Default form strings locally mapping to unified value
    const [devValue, setDevValue] = useState(currentFlow?.developerGroupId ? `group:${currentFlow.developerGroupId}` : (currentFlow?.developerId ? `user:${currentFlow.developerId}` : ''));
    const [testerValue, setTesterValue] = useState(currentFlow?.testerGroupId ? `group:${currentFlow.testerGroupId}` : (currentFlow?.testerId ? `user:${currentFlow.testerId}` : ''));

    const devGroups = groups?.filter(g => g.type === 'DEVELOPER') || [];
    const testerGroups = groups?.filter(g => g.type === 'TESTER') || [];

    const handleSave = async () => {
        setIsSaving(true);
        const devId = devValue.startsWith('user:') ? devValue.split(':')[1] : null;
        const devGroupId = devValue.startsWith('group:') ? devValue.split(':')[1] : null;
        const testerId = testerValue.startsWith('user:') ? testerValue.split(':')[1] : null;
        const testerGroupId = testerValue.startsWith('group:') ? testerValue.split(':')[1] : null;

        const res = await manageProjectAssignmentFlow(projectId, devId, testerId, devGroupId, testerGroupId);
        setIsSaving(false);
        if (res?.error) {
            alert(res.error);
        } else {
            setIsEditing(false);
        }
    };

    const handleDisable = async () => {
        if(!confirm("Are you sure you want to disable auto-assignment? Bugs will go to the backlog.")) return;
        setIsSaving(true);
        const res = await manageProjectAssignmentFlow(projectId, null, null, null, null);
        setIsSaving(false);
        if (res?.error) {
            alert(res.error);
        } else {
            setDevValue('');
            setTesterValue('');
            setIsEditing(false);
        }
    };

    if (!canEdit && !currentFlow) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <GitMerge className="w-48 h-48 rotate-12 text-indigo-500" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <GitMerge className="w-5 h-5" />
                            </span>
                            Auto-Assignment Workflow
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xl">
                            Configure automatic routing for newly reported bugs. Standard users will not be able to assign bugs directly unless they are the assigned Project Manager or Admin.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        {/* Auto-Assign Status Details */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${currentFlow ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                <span className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {currentFlow ? 'Active Flow' : 'Disabled'}
                                </span>
                            </div>

                            {/* Show the users if active */}
                            {currentFlow && !isEditing && (
                                <div className="flex items-center gap-6 mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-700/50">
                                            {currentFlow.developerGroupId ? 'G' : (currentFlow.developer?.name || currentFlow.developer?.email || 'D').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{currentFlow.developerGroupId ? 'Dev Group' : 'Developer'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {currentFlow.developerGroupId ? groups.find((g: any) => g.id === currentFlow.developerGroupId)?.name || 'Multiple Members' : (currentFlow.developer?.name || currentFlow.developer?.email)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-px bg-slate-300 dark:bg-slate-700 hidden sm:block delay-100 transition-all"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-700/50">
                                            {currentFlow.testerGroupId ? 'G' : (currentFlow.tester?.name || currentFlow.tester?.email || 'T').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">{currentFlow.testerGroupId ? 'QA Group' : 'QA Tester'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {currentFlow.testerGroupId ? groups.find((g: any) => g.id === currentFlow.testerGroupId)?.name || 'Multiple Members' : (currentFlow.tester?.name || currentFlow.tester?.email)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls/Edit Mode Button */}
                        {canEdit && !isEditing && (
                            <div className="shrink-0 flex items-center justify-center">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:shadow-md"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    Configure Assignment Settings
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Inline Expandable Edit UI - Rendered below the main card */}
                    {canEdit && isEditing && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-4 duration-200 relative z-20">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-indigo-500" />
                                        Update Assignment Mappings
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                                        Assign the default Developer and QA Tester for this project. When bugs are logged, they will be automatically sent to these team members, saving time manually triaging the unassigned backlog. Standard project contributors will not be permitted to override these assignments.
                                    </p>
                                </div>
                                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Target Developer</label>
                                    <select 
                                        value={devValue} 
                                        onChange={e => setDevValue(e.target.value)}
                                        className="w-full text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                                    >
                                        <option value="">-- Unassigned (Do not Auto-Assign) --</option>
                                        <optgroup label="Groups">
                                            {devGroups.map(g => <option key={g.id} value={`group:${g.id}`}>{g.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Individual Developers">
                                            {developers.map(d => <option key={d.id} value={`user:${d.id}`}>{d.name || d.email}</option>)}
                                        </optgroup>
                                    </select>
                                    <p className="text-xs text-slate-500">The developer or developer group who will handle bugs for this project.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Target QA Tester</label>
                                    <select 
                                        value={testerValue} 
                                        onChange={e => setTesterValue(e.target.value)}
                                        className="w-full text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                                    >
                                        <option value="">-- Unassigned (Do not Auto-Assign) --</option>
                                        <optgroup label="Groups">
                                            {testerGroups.map(g => <option key={g.id} value={`group:${g.id}`}>{g.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Individual Testers">
                                            {testers.map(t => <option key={t.id} value={`user:${t.id}`}>{t.name || t.email}</option>)}
                                        </optgroup>
                                    </select>
                                    <p className="text-xs text-slate-500">The QA tester or testing group who will re-validate the developer's fixes.</p>
                                </div>

                                <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row items-center gap-4 justify-end border-t border-slate-100 dark:border-slate-800 mt-2">
                                    {currentFlow && (
                                        <button 
                                            onClick={handleDisable}
                                            disabled={isSaving}
                                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 dark:border-rose-900/50 dark:hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            Disable Auto-Assignment
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving || !devValue || !testerValue}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
