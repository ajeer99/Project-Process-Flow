'use client';

import { useActionState, useEffect } from 'react';
import { createUser } from '../../../lib/actions/user';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export function CreateUserForm({ currentUserRole }: { currentUserRole: string }) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(createUser, undefined);

    useEffect(() => {
        if (state?.success) {
            toast.success('User created successfully!');
            router.push('/admin/users');
        }
    }, [state, router]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <form action={formAction} className="p-6 sm:p-8 space-y-8">
                
                {/* General Errors */}
                {state?.message && !state?.success && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                            {state.message}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-900 dark:text-slate-300">
                            Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            className="w-full rounded-xl border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                            placeholder="e.g. Jane Doe"
                        />
                        {state?.errors?.name && (
                            <p className="text-sm text-rose-500">{state.errors.name[0]}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-900 dark:text-slate-300">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="w-full rounded-xl border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                            placeholder="jane@company.com"
                        />
                        {state?.errors?.email && (
                            <p className="text-sm text-rose-500">{state.errors.email[0]}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-900 dark:text-slate-300">
                            Password <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            minLength={6}
                            className="w-full rounded-xl border-0 py-2.5 px-3.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                            placeholder="Minimum 6 characters"
                        />
                        {state?.errors?.password && (
                            <p className="text-sm text-rose-500">{state.errors.password[0]}</p>
                        )}
                    </div>

                    {/* Role Field */}
                    <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium text-slate-900 dark:text-slate-300">
                            System Role <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="role"
                                name="role"
                                required
                                defaultValue="TESTER"
                                className="w-full appearance-none rounded-xl border-0 py-2.5 pl-3.5 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors  bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22lucide%20lucide-chevron-down%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px]"
                            >
                                <option value="TESTER">Tester</option>
                                <option value="DEVELOPER">Developer</option>
                                <option value="PROJECT_MANAGER">Project Manager</option>
                                {currentUserRole !== 'PROJECT_MANAGER' && (
                                    <option value="ADMIN">Administrator</option>
                                )}
                            </select>
                        </div>
                        {state?.errors?.role && (
                            <p className="text-sm text-rose-500">{state.errors.role[0]}</p>
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <Link
                        href="/admin/users"
                        className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
                    >
                        {isPending ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create User
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
