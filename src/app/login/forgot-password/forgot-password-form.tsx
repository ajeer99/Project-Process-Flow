'use client';

import { useActionState, useState } from 'react';
import { forgotPassword } from '@/app/lib/actions/user';
import { useFormStatus } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordForm() {
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleFormAction = async (formData: FormData) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const email = formData.get('email') as string;
        const result = await forgotPassword(email);
        
        if (result.success) {
            setSuccessMessage(result.message || 'Success');
        } else {
            setErrorMessage(result.error || 'Failed to request password reset.');
        }
    };

    return (
        <form action={handleFormAction} className="w-full">
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
            </div>

            <SubmitButton />

            <div className="mt-4 flex flex-col gap-2">
                {errorMessage && (
                    <p className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg w-full">
                        {errorMessage}
                    </p>
                )}
                {successMessage && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-3 py-3 rounded-lg w-full">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <p>{successMessage}</p>
                    </div>
                )}
            </div>
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="mt-8 w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            aria-disabled={pending}
        >
            {pending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                'Send Temp Password'
            )}
        </button>
    );
}
