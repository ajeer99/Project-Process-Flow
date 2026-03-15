'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import { useFormStatus } from 'react-dom';

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <form action={formAction} className="w-full">
            <div className="flex flex-col gap-6 mt-6">
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        htmlFor="email"
                    >
                        Email Address
                    </label>
                    <div className="relative">
                        <input
                            className="peer block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-3 px-4 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all duration-300"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label
                            className="block text-sm font-medium text-gray-900 dark:text-gray-300"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <a 
                            href="/login/forgot-password" 
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        >
                            Forgot Password?
                        </a>
                    </div>
                    <div className="relative">
                        <input
                            className="peer block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-3 px-4 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all duration-300"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Enter password"
                            required
                            minLength={6}
                        />
                    </div>
                </div>
            </div>

            <LoginButton />

            <div className="mt-4 flex items-center gap-2">
                {errorMessage && (
                    <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg w-full">
                        {errorMessage}
                    </p>
                )}
            </div>
        </form>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-500/30 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            aria-disabled={pending}
        >
            {pending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                'Sign In'
            )}
        </button>
    );
}
