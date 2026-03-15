import { AlertCircle, ArrowLeft, Bug } from 'lucide-react';
import Link from 'next/link';
import ForgotPasswordForm from './forgot-password-form';

export default function ForgotPasswordPage() {
    return (
        <main className="flex items-center justify-center min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-500/20 dark:bg-purple-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 sm:p-10 transition-all duration-300">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                            <Bug className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                            Reset Password
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-center font-medium">
                            Enter your email to receive a temporary password.
                        </p>
                    </div>

                    <ForgotPasswordForm />

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                        <Link 
                            href="/login" 
                            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
