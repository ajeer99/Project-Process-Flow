'use client';

import { useState } from 'react';
import { updateProjectDetails, uploadProjectLogo, requestManagerChange } from '@/app/lib/actions/project';
import { Calendar, ImageIcon, Save, X, Edit2, UserCog, Mail, Loader2, Upload } from 'lucide-react';

export function ProjectHeader({ project, managers = [], currentUserRole }: { project: any, managers?: { id: string, name: string }[], currentUserRole?: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [imageUrl, setImageUrl] = useState(project.imageUrl || '');
    const [startDate, setStartDate] = useState(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
    const [endDate, setEndDate] = useState(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
    const [managerId, setManagerId] = useState(project.managerId || '');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Only attempt to update fields PM check
        const updates: any = { imageUrl: imageUrl || null };
        if (currentUserRole !== 'PROJECT_MANAGER') {
            updates.startDate = startDate ? new Date(startDate) : null;
            updates.endDate = endDate ? new Date(endDate) : null;
            updates.managerId = managerId || null;
        }

        await updateProjectDetails(project.id, updates);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleRequestChange = async () => {
        if (confirm("Are you sure you want to request an Admin to change the Project Manager?")) {
            await requestManagerChange(project.id);
            alert("Request sent to administrators.");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('logo', file);

        const res = await uploadProjectLogo(project.id, formData);
        if (res.success && res.imageUrl) {
            setImageUrl(res.imageUrl);
        } else {
            alert(res.error || 'Failed to upload image.');
        }
        setUploadingImage(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative">
            {/* Banner Background */}
            <div 
                className="h-48 w-full bg-slate-100 dark:bg-slate-800 relative group transition-all duration-300"
                style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-12 h-12 opacity-50" />
                        <span className="ml-2 font-medium">No Cover Pattern</span>
                    </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                
                {/* Edit Button overlay */}
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-2 rounded-xl transition-all shadow-sm ring-1 ring-white/20"
                    title="Edit Project Configuration"
                >
                    {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Content Section */}
            <div className="p-6 relative -mt-16">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                    <div className="text-white drop-shadow-md">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-500/30 text-indigo-50 rounded-md backdrop-blur-md text-sm font-semibold border border-indigo-400/30 shadow-inner">
                                {project.status}
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                        </div>
                        {project.description && (
                            <p className="mt-2 text-slate-100 max-w-2xl text-sm leading-relaxed">{project.description}</p>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                            <Edit2 className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Edit Project Settings</h3>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Cover Banner</label>
                            <label className="relative cursor-pointer max-w-xs flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-xl text-sm font-medium transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <Upload className="w-4 h-4 text-indigo-500" />}
                                {uploadingImage ? 'Uploading...' : (imageUrl ? 'Change Banner Image' : 'Upload Banner Image')}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                            <p className="text-xs text-slate-500 mt-2 ml-1">Upload a high quality panoramic image (Max 5MB).</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)}
                                    disabled={currentUserRole === 'PROJECT_MANAGER'}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)}
                                    disabled={currentUserRole === 'PROJECT_MANAGER'}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Manager</label>
                                {currentUserRole === 'PROJECT_MANAGER' ? (
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            readOnly
                                            value={managers.find(m => m.id === managerId)?.name || 'Unassigned'}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 opacity-70 pointer-events-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRequestChange}
                                            className="px-3 py-2.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30 rounded-xl transition-colors flex items-center justify-center gap-1 min-w-[140px] border border-orange-200 dark:border-orange-500/30 font-medium"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Request Change
                                        </button>
                                    </div>
                                ) : (
                                    <select 
                                        value={managerId} 
                                        onChange={e => setManagerId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white appearance-none"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="pt-3">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-70 shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
                            >
                                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
                                Save Configuration
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 flex flex-wrap gap-4 md:gap-8 items-center text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Project Timeframe</span>
                                <span className="font-medium text-slate-900 dark:text-white mt-0.5">
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending Start'}
                                    {' → '}
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Modules</span>
                                <span className="font-medium text-slate-900 dark:text-white text-lg mt-0.5">
                                    {project._count?.modules || 0}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Builds</span>
                                <span className="font-medium text-slate-900 dark:text-white text-lg mt-0.5">
                                    {project._count?.builds || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
