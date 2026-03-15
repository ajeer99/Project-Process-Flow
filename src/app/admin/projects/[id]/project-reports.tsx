'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function ProjectReports({ bugs }: { bugs: any[] }) {
    // Process bugs for Severity Chart
    const severityData = [
        { name: 'CRITICAL', value: bugs.filter(b => b.severity === 'CRITICAL').length, color: '#ef4444' }, // red-500
        { name: 'HIGH', value: bugs.filter(b => b.severity === 'HIGH').length, color: '#f97316' },     // orange-500
        { name: 'MEDIUM', value: bugs.filter(b => b.severity === 'MEDIUM').length, color: '#eab308' },   // yellow-500
        { name: 'LOW', value: bugs.filter(b => b.severity === 'LOW').length, color: '#3b82f6' },      // blue-500
    ].filter(d => d.value > 0);

    // Process bugs for Status Chart
    const statusCounts = bugs.reduce((acc, bug) => {
        acc[bug.status] = (acc[bug.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        count
    }));

    // Generate brief summary metrics
    const totalBugs = bugs.length;
    const fixedVerified = bugs.filter(b => ['FIXED', 'VERIFIED'].includes(b.status)).length;
    const completionRate = totalBugs === 0 ? 0 : Math.round((fixedVerified / totalBugs) * 100);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Activity className="w-5 h-5 text-indigo-500" />
                Project Intelligence
            </h2>

            {/* Top Level Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tracked Issues</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalBugs}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved & Verified</p>
                            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{fixedVerified}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolution Rate</p>
                            <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{completionRate}%</h3>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                             <div className="absolute inset-0 border-4 border-indigo-500 rounded-full" style={{ clipPath: `inset(${100 - completionRate}% 0 0 0)` }}></div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300 z-10">{completionRate}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Severity Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Severity Distribution</h3>
                    {severityData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={severityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {severityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">No severity data available.</div>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Pipeline Spread</h3>
                    {statusData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">No pipeline data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
