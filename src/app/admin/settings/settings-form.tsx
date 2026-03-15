'use client';

import { useState, useEffect } from 'react';
import { updateNotificationPreference, updatePassword, uploadAvatar } from '../../lib/actions/user';
import { Bell, KeyRound, Monitor, Moon, Sun, Loader2, CheckCircle2, User as UserIcon, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from 'next-themes';

type SettingsProps = {
    userId: string;
    initialData: {
        notificationsEnabled: boolean;
        email: string;
        name: string | null;
        role: string;
        avatarUrl: string | null;
    }
}

export default function SettingsForm({ userId, initialData }: SettingsProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [notifsEnabled, setNotifsEnabled] = useState(initialData.notificationsEnabled);
    const [notifSaving, setNotifSaving] = useState(false);

    const [avatarState, setAvatarState] = useState(initialData.avatarUrl);
    const [avatarUploading, setAvatarUploading] = useState(false);

    const [pwdState, setPwdState] = useState({ current: '', new: '', confirm: '' });
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdMessage, setPwdMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        setMounted(true);
    }, []);

    const applyTheme = (t: string) => {
        setTheme(t);
    };

    const handleNotifToggle = async () => {
        setNotifSaving(true);
        const newState = !notifsEnabled;
        setNotifsEnabled(newState);
        await updateNotificationPreference(newState);
        setNotifSaving(false);
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await uploadAvatar(null, formData);
        if (res.success && res.avatarUrl) {
            setAvatarState(res.avatarUrl);
        } else {
            alert(res.error || "Failed to upload avatar");
        }
        setAvatarUploading(false);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdSaving(true);
        setPwdMessage({ text: '', type: '' });
        
        const formData = new FormData();
        formData.append('currentPassword', pwdState.current);
        formData.append('newPassword', pwdState.new);
        formData.append('confirmPassword', pwdState.confirm);

        const res = await updatePassword(null, formData);
        
        if (res.error || res.message) {
             setPwdMessage({ text: res.error || res.message || "Failed.", type: res.success ? 'success' : 'error' });
        }

        if (res.success) {
            setPwdState({ current: '', new: '', confirm: '' });
        }
        
        setPwdSaving(false);
    };

    return (
        <div className="space-y-8">
            {/* PROFILE SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {avatarState ? (
                                <img src={avatarState} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-10 h-10 text-slate-400" />
                            )}
                            {avatarUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Upload a new avatar to identify yourself in the chat and comments.
                            </p>
                            <div className="flex items-center gap-3">
                                <label className="relative cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                                    <span className="flex items-center gap-2">
                                        <Camera className="w-4 h-4" />
                                        Choose Image
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                        disabled={avatarUploading}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREFERENCES SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Preferences</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Theme Setting */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Interface Theme</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select or customize your UI theme.</p>
                            </div>
                            
                            {mounted ? (
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                                    <button
                                        onClick={() => applyTheme('light')}
                                        className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", theme === 'light' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                                    >
                                        <Sun className="w-4 h-4" /> Light
                                    </button>
                                    <button
                                        onClick={() => applyTheme('dark')}
                                        className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", theme === 'dark' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                                    >
                                        <Moon className="w-4 h-4" /> Dark
                                    </button>
                                    <button
                                        onClick={() => applyTheme('system')}
                                        className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", theme === 'system' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}
                                    >
                                        <Monitor className="w-4 h-4" /> System
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {/* Notifications Setting */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Email & In-App Notifications</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Receive alerts when bugs are assigned to you or updated.</p>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", notifsEnabled ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}>
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white text-sm">Allow Notifications</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Push & In-app alerts</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleNotifToggle}
                                    disabled={notifSaving}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                        notifsEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            notifsEnabled ? "translate-x-6" : "translate-x-1"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECURITY SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Security & Password</h2>
                    
                    <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                       <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                            <input
                                type="password"
                                required
                                value={pwdState.current}
                                onChange={e => setPwdState(p => ({ ...p, current: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                            <input
                                type="password"
                                required
                                value={pwdState.new}
                                onChange={e => setPwdState(p => ({ ...p, new: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={pwdState.confirm}
                                onChange={e => setPwdState(p => ({ ...p, confirm: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>

                        {pwdMessage.text && (
                            <div className={cn("p-3 rounded-lg text-sm font-medium flex items-center gap-2", pwdMessage.type === 'success' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400")}>
                                {pwdMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                {pwdMessage.text}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={pwdSaving || !pwdState.current || !pwdState.new || !pwdState.confirm}
                                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm disabled:opacity-50"
                            >
                                {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
