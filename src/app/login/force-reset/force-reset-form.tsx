'use client';

import { useActionState, useState } from 'react';
import { updatePasswordForce } from '@/app/lib/actions/user'; // Need to create this
import { useFormStatus } from 'react-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ForceResetForm() {
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleFormAction = async (formData: FormData) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        
        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMessage("Password must be at least 6 characters.");
            return;
        }

        const result = await updatePasswordForce(newPassword);
        
        if (result.success) {
            setSuccessMessage(result.message || 'Success');
            // Give time to read message, then redirect to dashboard which will route them correctly
            setTimeout(() => {
                router.push('/admin/dashboard');
                router.refresh(); // Refresh to ensure session gets updated client-side layout
            }, 2000);
        } else {
            setErrorMessage(result.error || result.message || 'Failed to update password.');
        }
    };

    return (
        <form action={handleFormAction} className="w-full">
            <div className="flex flex-col gap-6 mt-6">
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        htmlFor="newPassword"
                    >
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            className="peer block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-3 px-4 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all duration-300"
                            id="newPassword"
                            type="password"
                            name="newPassword"
                            placeholder="Enter new password"
                            required
                            minLength={6}
                        />
                    </div>
                </div>
                <div>
                    <label
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        htmlFor="confirmPassword"
                    >
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <input
                            className="peer block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-3 px-4 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all duration-300"
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                        />
                    </div>
                </div>
            </div>

            <SubmitButton />

            <div className="mt-4 flex flex-col gap-2">
                {errorMessage && (
                    <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-500/10 px-3 py-3 rounded-lg w-full">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMessage}</p>
                    </div>
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
            className="mt-8 w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 dark:from-rose-600 dark:to-orange-600 dark:hover:from-rose-500 dark:hover:to-orange-500 text-white font-medium py-3 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            aria-disabled={pending}
        >
            {pending ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                'Update Password & Continue'
            )}
        </button>
    );
}
