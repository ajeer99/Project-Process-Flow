import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import { WelcomeBanner } from './welcome-banner';
import { BugFlowChart, RatioStatBlock } from './bug-flow-chart';
import prisma from '@/app/lib/prisma';
import { Briefcase, Bug as BugIcon, CheckCircle2, AlertTriangle, Code2, TestTube2, GitMerge, Users, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const role = (session.user as any).role;
    const userId = session.user.id;

    // --- Global Chart Data Calculation ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentBugs = await prisma.bug.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, status: true }
    });

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    const chartData = days.map(dateStr => ({ date: dateStr, reported: 0, fixed: 0 }));
    let totalReported = 0;
    let totalFixed = 0;

    recentBugs.forEach(bug => {
        const dateStr = bug.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayData = chartData.find(d => d.date === dateStr);
        if (dayData) {
            dayData.reported += 1;
            totalReported += 1;
            if (bug.status === 'VERIFIED' || bug.status === 'FIXED') {
                dayData.fixed += 1;
                totalFixed += 1;
            }
        }
    });

    // --- Developer View ---
    if (role === 'DEVELOPER') {
        const myOpenBugs = await prisma.bug.count({ where: { developerId: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] } } });
        const myFixedBugs = await prisma.bug.count({ where: { developerId: userId, status: 'READY_FOR_RETEST' } });
        const myVerifiedBugs = await prisma.bug.count({ where: { developerId: userId, status: 'VERIFIED' } });
        const globalOpenBugs = await prisma.bug.count({ where: { developerId: null, status: 'OPEN' } });

        const activeTesters = await prisma.user.findMany({
            where: { role: 'TESTER', isOnline: true },
            select: { id: true, name: true, email: true }
        });

        return (
            <div className="space-y-6">
                <WelcomeBanner email={session.user.email} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="My Work Queue" value={myOpenBugs} icon={<Code2 className="w-5 h-5" />} color="indigo" />
                    <MetricCard title="Pending QA Validation" value={myFixedBugs} icon={<TestTube2 className="w-5 h-5" />} color="amber" />
                    <MetricCard title="Successfully Verified" value={myVerifiedBugs} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
                    <MetricCard title="Global Backlog" value={globalOpenBugs} icon={<BugIcon className="w-5 h-5" />} color="rose" />
                </div>
                {/* Developer Specific Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Global Bug Burn-down</h2>
                        <BugFlowChart data={chartData} />
                    </div>
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">QA Testers Online</h3>
                        <div className="flex-1 space-y-4">
                            {activeTesters.length === 0 ? (
                                <p className="text-sm text-slate-500">No QA testers are currently online.</p>
                            ) : (
                                activeTesters.map(tester => (
                                    <div key={tester.id} className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="font-medium text-sm text-slate-900 dark:text-white">{tester.name || tester.email}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Tester View ---
    if (role === 'TESTER') {
        const myValidations = await prisma.bug.count({ where: { testerId: userId, status: 'READY_FOR_RETEST' } });
        const IncomingPipeline = await prisma.bug.count({ where: { testerId: userId, status: { in: ['IN_PROGRESS', 'OPEN', 'REOPENED'] } } });
        const myVerifiedBugs = await prisma.bug.count({ where: { testerId: userId, status: 'VERIFIED' } });

        const activeDevelopers = await prisma.user.findMany({
            where: { role: 'DEVELOPER', isOnline: true },
            select: { id: true, name: true, email: true }
        });

        return (
            <div className="space-y-6">
                <WelcomeBanner email={session.user.email} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Pending Validation" value={myValidations} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
                    <MetricCard title="Clears (All Time)" value={myVerifiedBugs} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
                    <MetricCard title="Incoming Pipeline" value={IncomingPipeline} icon={<GitMerge className="w-5 h-5" />} color="indigo" />
                    <MetricCard title="QA Clearance Rate" value={totalReported > 0 ? `${Math.round((totalFixed / totalReported) * 100)}%` : "100%"} icon={<Briefcase className="w-5 h-5" />} color="slate" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Project Velocity</h2>
                        <BugFlowChart data={chartData} />
                    </div>
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Developers Online</h3>
                        <div className="flex-1 space-y-4">
                            {activeDevelopers.length === 0 ? (
                                <p className="text-sm text-slate-500">No developers are currently online.</p>
                            ) : (
                                activeDevelopers.map(dev => (
                                    <div key={dev.id} className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="font-medium text-sm text-slate-900 dark:text-white">{dev.name || dev.email}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Admin View ---
    const allProjectsCount = await prisma.project.count();
    const allBugsOpenCount = await prisma.bug.count({ where: { status: { not: 'VERIFIED' } } });
    const allBugsVerifiedCount = await prisma.bug.count({ where: { status: 'VERIFIED' } });
    const allModulesCount = await prisma.module.count();

    const allUsers = await prisma.user.findMany({
        select: { 
            id: true, 
            name: true, 
            email: true, 
            isOnline: true, 
            lastActive: true, 
            loginCount: true, 
            role: true,
            bugsAssigned: { where: { status: 'FIXED' } },
            bugsReported: true
        },
        orderBy: { lastActive: 'desc' }
    });

    // Estimate: 2 hours per fixed bug, 0.5 hours per reported bug
    const usersWithHours = allUsers.map(u => ({
        ...u,
        estimatedHours: (u.bugsAssigned.length * 2) + (u.bugsReported.length * 0.5)
    }));

    return (
        <div className="space-y-6">
            <WelcomeBanner email={session.user.email} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Projects" value={allProjectsCount} icon={<Briefcase className="w-5 h-5" />} color="indigo" />
                <MetricCard title="Active Modules" value={allModulesCount} icon={<Package className="w-5 h-5" />} color="emerald" />
                <MetricCard title="Unresolved Issues" value={allBugsOpenCount} icon={<BugIcon className="w-5 h-5" />} color="amber" />
                <MetricCard title="Verified Clears" value={allBugsVerifiedCount} icon={<CheckCircle2 className="w-5 h-5" />} color="slate" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Bug Resolution Flow</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Past 7 days volume of reported anomalies versus resolved tickets.</p>
                    <BugFlowChart data={chartData} />
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <RatioStatBlock reported={totalReported} fixed={totalFixed} />
                    <div className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-center">
                        <h3 className="text-xl font-bold mb-2">Efficiency Rating</h3>
                        <p className="text-indigo-100 text-sm opacity-90">Keep monitoring the clear rate to ensure the backlog is consistently burning down faster than discovery.</p>
                    </div>
                </div>
            </div>

            {/* Admin Omni-Roster */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Live Roster
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Last Active</th>
                                <th className="px-6 py-4 font-medium text-right">Logins</th>
                                <th className="px-6 py-4 font-medium text-right">Est. Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {usersWithHours.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {u.name || u.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'TESTER' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.isOnline ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Offline
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(u.lastActive).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                        {u.loginCount}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-indigo-600 dark:text-indigo-400">
                                        {u.estimatedHours > 0 ? `${u.estimatedHours}h` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
    const colorClasses = {
        indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
        emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
        rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
        slate: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10",
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    )
}
