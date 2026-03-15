import LoginForm from './login-form';
import { Metadata } from 'next';
import { getAppSettings } from '../lib/actions/app-settings';

export const metadata: Metadata = {
    title: 'Login - QA Portal',
};

export default async function LoginPage() {
    const res = await getAppSettings();
    const appName = res.settings?.appName || 'QA Portal';
    const logoUrl = res.settings?.logoUrl || null;

    return (
        <main className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
            <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-pink-500/20 dark:bg-pink-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />

            <div className="relative w-full max-w-[440px] p-8 mx-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 border border-white/20 dark:border-slate-700/50">
                <div className="flex flex-col items-center">
                    {logoUrl ? (
                        <div className="w-32 h-16 flex items-center justify-center mb-6">
                            <img src={logoUrl} alt={appName} className="max-h-full max-w-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                    
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
                        Welcome to {appName}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8">
                        Sign in to track bugs and manage test builds.
                    </p>

                    <LoginForm />
                </div>
            </div>
        </main>
    );
}
