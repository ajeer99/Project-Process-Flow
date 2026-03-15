'use client';

import { useState } from 'react';
import { updateProjectDetails, uploadProjectLogo } from '@/app/lib/actions/project';
import { deleteProject } from '../../lib/actions/project';
import { MoreVertical, Trash2, Edit2, Check, X, Calendar, User, Box, Hammer, Camera, Clock } from 'lucide-react';
import Link from 'next/link';

export function ProjectCard({ project, managers = [], userRole = 'ADMIN' }: { project: any, managers?: any[], userRole?: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [name, setName] = useState(project.name || '');
    const [description, setDescription] = useState(project.description || '');
    const [startDate, setStartDate] = useState(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
    const [endDate, setEndDate] = useState(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
    const [managerId, setManagerId] = useState(project.managerId || '');

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        const formData = new FormData();
        formData.append('logo', file);

        const res = await uploadProjectLogo(project.id, formData);
        if (res.error) {
            alert(res.error || "Failed to upload project logo");
        }
        setIsUploadingLogo(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updateProjectDetails(project.id, {
            name,
            description,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            managerId: managerId || null,
        });
        setIsSaving(false);
        setIsEditing(false);
    };

    const assignedManager = managers.find(m => m.id === project.managerId);

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all flex flex-col min-h-[220px] overflow-hidden">
            {project.imageUrl && (
                <div className="absolute top-0 left-0 right-0 h-24 bg-cover bg-center z-0 opacity-20 transition-opacity blur-[2px] pointer-events-none" style={{ backgroundImage: `url(${project.imageUrl})` }}></div>
            )}
            
            {isEditing && (
                <div className="absolute top-4 left-6 z-20">
                    <label className="relative cursor-pointer bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm inline-flex items-center gap-2">
                        {isUploadingLogo ? (
                            <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        )}
                        <span className="text-slate-700 dark:text-slate-300">Set Logo</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={isUploadingLogo}
                        />
                    </label>
                </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20 shadow-sm backdrop-blur-sm">
                    {project.status}
                </span>
                {(userRole === 'ADMIN' || userRole === 'PROJECT_MANAGER') && (
                    <div className="dropdown relative z-20">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsEditing(!isEditing);
                            }}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            {isEditing ? <X className="w-4 h-4 pointer-events-none" /> : <Edit2 className="w-4 h-4 pointer-events-none" />}
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="mb-4 z-10 space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        Edit Project
                    </h3>
                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project Name"
                            className="w-full text-lg font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            rows={2}
                            className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 resize-none"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {userRole === 'ADMIN' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Project Manager</label>
                            <select
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                            >
                                <option value="">-- Unassigned --</option>
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name || m.email}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Check className="w-4 h-4" />}
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mb-4 pr-12 space-y-3 z-10 flex-1">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white pr-8 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {project.description}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {!isEditing && (
                <div className="mt-auto z-10 space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Manager
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 truncate">
                                {assignedManager ? (assignedManager.name || assignedManager.email) : 'Unassigned'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Timeframe
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 truncate">
                                {project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Ongoing'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5" title="Total Expected Effort Tracked">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <strong className="text-slate-700 dark:text-slate-300">
                                    {(() => {
                                        const mins = project.totalTimeSpentMinutes || 0;
                                        if (mins === 0) return '0h';
                                        const d = Math.floor(mins / (60 * 24));
                                        const h = Math.floor((mins % (60 * 24)) / 60);
                                        const m = Math.floor(mins % 60);
                                        
                                        const parts = [];
                                        if (d > 0) parts.push(`${d}d`);
                                        if (h > 0) parts.push(`${h}h`);
                                        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
                                        
                                        return parts.join(' ');
                                    })()}
                                </strong>
                            </span>
                            <span className="flex items-center gap-1.5" title="Modules">
                                <Box className="w-4 h-4 text-slate-400" />
                                <strong className="text-slate-700 dark:text-slate-300">{project._count?.modules || 0}</strong>
                            </span>
                            <span className="flex items-center gap-1.5" title="Builds">
                                <Hammer className="w-4 h-4 text-slate-400" />
                                <strong className="text-slate-700 dark:text-slate-300">{project._count?.builds || 0}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link 
                                href={`/admin/projects/${project.id}`} 
                                className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Dashboard
                            </Link>
                            {userRole === 'ADMIN' && (
                                <button onClick={() => deleteProject(project.id)} className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Delete Project">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
