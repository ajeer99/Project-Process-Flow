'use client';

import { useEffect } from 'react';
import { ShieldCheck, Bug, Activity, CheckCircle2, Trophy, Box } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { PrintControls } from '../../../../../../components/print-controls';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function ModuleAnalyticsReport({ moduleData }: { moduleData: any }) {
    // 1. Core Metrics
    const bugs = moduleData.bugs || [];
    const totalBugs = bugs.length;
    const fixedVerBugs = bugs.filter((b: any) => ['FIXED', 'VERIFIED'].includes(b.status));
    const completionRate = totalBugs > 0 ? Math.round((fixedVerBugs.length / totalBugs) * 100) : 0;
    
    // Severity Data
    const severityData = [
        { name: 'CRITICAL', value: bugs.filter((b: any) => b.severity === 'CRITICAL').length, color: '#ef4444' },
        { name: 'HIGH', value: bugs.filter((b: any) => b.severity === 'HIGH').length, color: '#f97316' },
        { name: 'MEDIUM', value: bugs.filter((b: any) => b.severity === 'MEDIUM').length, color: '#eab308' },
        { name: 'LOW', value: bugs.filter((b: any) => b.severity === 'LOW').length, color: '#3b82f6' },
    ].filter(d => d.value > 0);

    // 2. Leaderboards
    const developerStats: Record<string, { user: any, fixed: number }> = {};
    const testerStats: Record<string, { user: any, reported: number, verified: number }> = {};

    bugs.forEach((bug: any) => {
        // Dev Stats (Fixed)
        const solver = bug.resolvedBy || bug.developer;
        if (solver && ['FIXED', 'VERIFIED'].includes(bug.status)) {
            const devId = solver.id;
            if (!developerStats[devId]) developerStats[devId] = { user: solver, fixed: 0 };
            developerStats[devId].fixed++;
        }
        
        // Tester Stats (Reported/Verified)
        const qa = bug.verifiedBy || bug.tester;
        if (qa) {
            const testerId = qa.id;
            if (!testerStats[testerId]) testerStats[testerId] = { user: qa, reported: 0, verified: 0 };
            testerStats[testerId].reported++;
            if (bug.status === 'VERIFIED') testerStats[testerId].verified++;
        }
    });

    const topSolvers = Object.values(developerStats).sort((a, b) => b.fixed - a.fixed).slice(0, 5);
    const topTesters = Object.values(testerStats).sort((a, b) => b.reported - a.reported).slice(0, 5);

    // 3. Trend Analysis (Last 30 Days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentBugs = bugs.filter((b: any) => isAfter(new Date(b.createdAt), thirtyDaysAgo));
    
    const trendMap = Array.from({ length: 4 }, (_, i) => {
        const weekStart = subDays(new Date(), (i + 1) * 7);
        const weekEnd = subDays(new Date(), i * 7);
        return {
            name: `Week ${4-i}`,
            reported: recentBugs.filter((b: any) => b.createdAt >= weekStart && b.createdAt < weekEnd).length,
            fixed: recentBugs.filter((b: any) => ['FIXED', 'VERIFIED'].includes(b.status) && b.updatedAt >= weekStart && b.updatedAt < weekEnd).length,
        }
    }).reverse();

    // Auto-print prompt on load removed based on user preference and replaced with explicit PrintControls

    const pageClasses = "max-w-4xl mx-auto bg-white p-8 print:p-0 print:max-w-none print:w-full min-h-screen text-slate-900";

    return (
        <div className="bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white print:w-full print:m-0">
            <div className="max-w-4xl mx-auto print:hidden">
                <PrintControls />
            </div>
            {/* Page 1: Overview & Analytics */}
            <div className={`${pageClasses} print:break-after-page`}>
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <div className="text-sm font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1 mb-2">
                            {moduleData.project.name} <span className="text-slate-300 mx-1">•</span> Module Intelligence Report
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900">{moduleData.name} Analytics</h1>
                        <p className="text-slate-600 mt-2 max-w-2xl">Isolated analytics and bug metrics specifically targeted to the {moduleData.name} component module.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Generated On</div>
                        <div className="font-bold text-slate-900 text-lg">{format(new Date(), 'MMM dd, yyyy')}</div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-lg text-sm font-semibold border border-indigo-100 text-indigo-700">
                            <Box className="w-4 h-4" />
                            Targeted Module Report
                        </div>
                    </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl print:border-slate-300">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-2"><Bug className="w-4 h-4" /> Total Tracked in Module</p>
                        <div className="text-3xl font-black text-slate-900">{totalBugs}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl print:border-slate-300">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolved/Verified</p>
                        <div className="text-3xl font-black text-emerald-700">{fixedVerBugs.length}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl print:border-slate-300">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-600" /> Resolution Rate</p>
                        <div className="text-3xl font-black text-indigo-700">{completionRate}%</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    {/* Charts */}
                    <div className="border border-slate-200 p-5 rounded-xl print:border-slate-300">
                        <h3 className="text-sm font-bold uppercase text-slate-800 mb-4 border-b border-slate-100 pb-2">Severity Distribution</h3>
                        <div className="h-64">
                            {severityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                                            {severityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-slate-400">No data</div>}
                        </div>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl print:border-slate-300">
                        <h3 className="text-sm font-bold uppercase text-slate-800 mb-4 border-b border-slate-100 pb-2">30-Day Activity Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendMap}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }}/>
                                    <Bar dataKey="reported" name="Reported" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="fixed" name="Resolved" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Leaderboards */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-indigo-600" /> Top Solvers (Developers)</h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Developer</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Fixed Here</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topSolvers.length > 0 ? topSolvers.map((stat, i) => (
                                        <tr key={i} className="bg-white">
                                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{i+1}</div>
                                                {stat.user.name}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-indigo-600">{stat.fixed}</td>
                                        </tr>
                                    )) : <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No resolved issues yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Top Testers (QA)</h3>
                        <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Tester</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700 text-right">Reported Here</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topTesters.length > 0 ? topTesters.map((stat, i) => (
                                        <tr key={i} className="bg-white">
                                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{i+1}</div>
                                                {stat.user.name}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{stat.reported}</td>
                                        </tr>
                                    )) : <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No issues reported yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* Global Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1.5cm;
                    }
                    html, body {
                        background: white;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
