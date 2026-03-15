import { Bug } from 'lucide-react';
import ForceResetForm from './force-reset-form';

export default function ForceResetPage() {
    return (
        <main className="flex items-center justify-center min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
            {/* Background Effects */}
            <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-rose-500/20 dark:bg-rose-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-orange-500/20 dark:bg-orange-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 sm:p-10 transition-all duration-300">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/30 mb-6 transform hover:rotate-6 transition-transform duration-300">
                            <Bug className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 text-center">
                            Action Required
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-center font-medium">
                            You must change your password to continue.
                        </p>
                    </div>

                    <ForceResetForm />
                </div>
            </div>
        </main>
    );
}
