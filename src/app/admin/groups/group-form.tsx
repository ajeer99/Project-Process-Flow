'use client';

import { Save, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState } from 'react';
import { createGroup, updateGroup } from '@/app/lib/actions/group';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function GroupForm({ 
    initialData = null, 
    allUsers = [] 
}: { 
    initialData?: any; 
    allUsers?: any[]; 
}) {
    const router = useRouter();
    const isEdit = !!initialData;
    const [isSaving, setIsSaving] = useState(false);
    const [type, setType] = useState<string>(initialData?.type || 'DEVELOPER');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set(initialData?.users?.map((u: any) => u.id) || []));
    const [error, setError] = useState('');
    
    const filteredUsers = allUsers.filter(u => u.role === type);

    const toggleUser = (userId: string) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(userId)) newSet.delete(userId);
        else newSet.add(userId);
        setSelectedUsers(newSet);
    };

    async function submitForm(formData: FormData) {
        setIsSaving(true);
        setError('');
        
        let res;
        if (isEdit) {
            res = await updateGroup(initialData.id, {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                type: formData.get('type') as string,
                userIds: Array.from(selectedUsers)
            });
        } else {
            selectedUsers.forEach(id => formData.append('userIds', id));
            res = await createGroup(null, formData);
        }

        setIsSaving(false);
        const errorMsg = (res as any)?.error;
        const msg = (res as any)?.message;
        
        if (errorMsg || msg === 'A group with this name already exists.') {
            setError(errorMsg || msg);
            toast.error(errorMsg || msg);
        } else {
            toast.success(isEdit ? 'Group updated successfully!' : 'Group created successfully!');
            router.push('/admin/users?tab=groups');
        }
    }

    return (
        <form action={submitForm} className="max-w-3xl space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {isEdit ? 'Edit Group Information' : 'Group Information'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Group details and members.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-200 dark:border-red-800/50">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Group Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            defaultValue={initialData?.name || ''}
                            className="w-full text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="type" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Group Type
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                                setSelectedUsers(new Set()); // Clear selection on type change
                            }}
                            className="w-full text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                        >
                            <option value="DEVELOPER">Developer Group</option>
                            <option value="TESTER">Tester Group</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            defaultValue={initialData?.description || ''}
                            className="w-full text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                            Select Members
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredUsers.length === 0 && (
                                <div className="col-span-full text-sm text-slate-500 italic">No users found for this role.</div>
                            )}
                            {filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => toggleUser(u.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        selectedUsers.has(u.id) 
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        selectedUsers.has(u.id) 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                        {(u.name || u.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-sm font-bold truncate text-slate-900 dark:text-white">{u.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{u.role}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4">
                <Link
                    href="/admin/users?tab=groups"
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Group')}
                </button>
            </div>
        </form>
    );
}
