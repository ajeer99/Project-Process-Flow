'use client';

import { useState, useEffect } from 'react';
import { DatabaseBackup, Download, Upload, Loader2, Save, LayoutTemplate, ImagePlus } from 'lucide-react';
import { getAppSettings, updateAppName, uploadAppAsset, updateAutoBackup } from '../../lib/actions/app-settings';

export function SystemSettingsForm() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [appSettings, setAppSettings] = useState({
        appName: 'QA Portal',
        logoUrl: '',
        iconUrl: '',
        autoBackupEnabled: false,
        backupFrequency: 'DAILY'
    });
    const [appSaving, setAppSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);

    useEffect(() => {
        getAppSettings().then(res => {
            if (res.success && res.settings) {
                setAppSettings({
                    appName: res.settings.appName,
                    logoUrl: res.settings.logoUrl || '',
                    iconUrl: res.settings.iconUrl || '',
                    autoBackupEnabled: res.settings.autoBackupEnabled ?? false,
                    backupFrequency: res.settings.backupFrequency || 'DAILY'
                });
            }
        });
    }, []);

    const handleAppNameSave = async () => {
        setAppSaving(true);
        setMessage(''); setError('');
        
        try {
            await updateAppName(appSettings.appName); 
            await updateAutoBackup(appSettings.autoBackupEnabled, appSettings.backupFrequency);
            setMessage('Settings updated successfully.');
        } catch (e: any) {
             setError(e.message || 'Failed to update settings');
        }

        setAppSaving(false);
    };

    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'logo') setUploadingLogo(true);
        if (type === 'icon') setUploadingIcon(true);
        setMessage(''); setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const res = await uploadAppAsset(formData);
        if (res.success && res.url) {
            setAppSettings(prev => ({
                ...prev,
                [type === 'logo' ? 'logoUrl' : 'iconUrl']: res.url
            }));
            setMessage(`${type === 'logo' ? 'Logo' : 'Icon'} uploaded successfully.`);
            setTimeout(() => {
                window.location.reload(); // Force full reload to update layouts globally (NextJS server component workaround)
            }, 1000);
        } else {
            setError(res.error || `Failed to upload ${type}.`);
        }

        if (type === 'logo') setUploadingLogo(false);
        if (type === 'icon') setUploadingIcon(false);
    };

    const handleBackup = async () => {
        setIsGenerating(true);
        setMessage('');
        setError('');
        
        try {
            // Trigger backup logic
            const res = await fetch('/api/admin/backup', { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Backup failed');
            }
            
            // Provide download link
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qa_portal_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            setMessage('Database backup generated successfully.');
        } catch (e: any) {
            setError(e.message || 'Failed to generate backup.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 mt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <DatabaseBackup className="w-5 h-5 text-indigo-500" />
                Database Backup & Restore
            </h2>

            {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl text-sm font-medium">{message}</div>}
            {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

            <div className="space-y-8">
                {/* Branding Settings */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Branding & Appearance</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Application Name</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={appSettings.appName}
                                    onChange={e => setAppSettings({...appSettings, appName: e.target.value})}
                                    placeholder="e.g. QA Portal"
                                    className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                />
                                <button
                                    onClick={handleAppNameSave}
                                    disabled={appSaving || !appSettings.appName}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm font-medium text-sm whitespace-nowrap"
                                >
                                    {appSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Navigation Logo (Full Width)</label>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-32 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                        {appSettings.logoUrl ? (
                                            <img src={appSettings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                                        ) : (
                                            <LayoutTemplate className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <label className="relative cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-2">
                                            {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload Logo
                                        </span>
                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleAssetUpload(e, 'logo')} disabled={uploadingLogo} />
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">App Icon / Favicon (Square)</label>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                        {appSettings.iconUrl ? (
                                            <img src={appSettings.iconUrl} alt="Icon" className="w-full h-full object-cover p-1" />
                                        ) : (
                                            <ImagePlus className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <label className="relative cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-2">
                                            {uploadingIcon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload Icon
                                        </span>
                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleAssetUpload(e, 'icon')} disabled={uploadingIcon} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Backup Settings */}
                <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                        <DatabaseBackup className="w-5 h-5 text-indigo-500" />
                        Data Management & Backups
                    </h3>
                    
                    {/* Auto Backup Configuration */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Auto-Backup Scheduling</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Automatically generate a full system backup.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                value={appSettings.backupFrequency}
                                onChange={(e) => setAppSettings({ ...appSettings, backupFrequency: e.target.value })}
                            >
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={appSettings.autoBackupEnabled} onChange={(e) => setAppSettings({ ...appSettings, autoBackupEnabled: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                            </label>
                            <button
                                onClick={handleAppNameSave}
                                disabled={appSaving}
                                className="ml-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm font-medium text-sm whitespace-nowrap"
                            >
                                {appSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Config
                            </button>
                        </div>
                    </div>

                    {/* Manual Backup */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Manual Export</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Download a secure JSON copy of your selected data type.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                id="backupType"
                                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="full">Full Backup (Data + Configs)</option>
                                <option value="data_only">Data Only (Users, Projects, Bugs)</option>
                                <option value="config_only">Config Only (Settings, SMTP)</option>
                            </select>
                            <button
                                onClick={() => {
                                    const type = (document.getElementById('backupType') as HTMLSelectElement).value;
                                    // handleBackup with type
                                    setIsGenerating(true);
                                    setMessage(''); setError('');
                                    fetch(`/api/admin/backup?type=${type}`, { method: 'POST' })
                                        .then(res => res.blob())
                                        .then(blob => {
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `qa_portal_export_${type}_${new Date().toISOString().split('T')[0]}.json`;
                                            a.click();
                                            setMessage(`Generated ${type} backup successfully.`);
                                        })
                                        .catch(() => setError('Failed generating backup'))
                                        .finally(() => setIsGenerating(false));
                                }}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm font-medium text-sm whitespace-nowrap"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Restore Backup */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Restore Backup</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Upload a previously exported JSON backup file to overwrite current data.</p>
                        </div>
                        <label className="relative cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl transition-all shadow-sm font-medium text-sm whitespace-nowrap">
                            <Upload className="w-4 h-4" />
                            Upload & Restore
                            <input type="file" accept=".json" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!confirm("WARNING: Restoring a backup will overwrite existing records with the backup's data. This action cannot be undone. Are you sure you want to proceed?")) return;
                                setIsGenerating(true);
                                setMessage(''); setError('');
                                const formData = new FormData();
                                formData.append('file', file);
                                fetch('/api/admin/restore', { method: 'POST', body: formData })
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.success) setMessage('Database restored successfully.');
                                        else setError(data.error || 'Restore failed.');
                                    })
                                    .catch(() => setError('Upload failed'))
                                    .finally(() => setIsGenerating(false));
                            }} />
                        </label>
                    </div>

                    {/* Danger Zone: Erase Data */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20">
                        <div>
                            <h3 className="font-semibold text-rose-700 dark:text-rose-400">Erase All Project Data</h3>
                            <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mt-1 max-w-lg">Permanently delete all projects, modules, builds, bugs, comments, and messages. User accounts and app settings will be preserved.</p>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm("DANGER: This will permanently wipe ALL projects, bugs, comments, and activity logs. Are you absolutely certain you want to proceed? Type 'CONFIRM' to proceed.") === false) return;
                                const proof = prompt("Type 'CONFIRM' to execute data wipe:");
                                if (proof !== 'CONFIRM') return alert("Data wipe aborted.");
                                
                                setIsGenerating(true);
                                setMessage(''); setError('');
                                fetch('/api/admin/erase-data', { method: 'POST' })
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.success) {
                                            setMessage('All project data was successfully erased.');
                                            setTimeout(() => window.location.reload(), 1500);
                                        } else setError(data.error || 'Erase failed.');
                                    })
                                    .catch(() => setError('Erase failed'))
                                    .finally(() => setIsGenerating(false));
                            }}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm font-medium text-sm whitespace-nowrap"
                        >
                            Factory Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
