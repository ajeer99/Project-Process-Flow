'use client';

export function WelcomeBanner({ email }: { email?: string | null }) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/20">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                    Welcome back, {email?.split('@')[0]}!
                </h1>
                <p className="text-indigo-100 max-w-xl text-lg">
                    Check your dashboard for the latest updates on projects, modules, and bug reports.
                </p>
            </div>
        </div>
    );
}
