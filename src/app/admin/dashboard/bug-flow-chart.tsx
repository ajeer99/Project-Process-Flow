'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function BugFlowChart({ data }: { data: any[] }) {
    return (
        <div className="w-full h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.2} />
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        dy={10} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        allowDecimals={false}
                        dx={-10} 
                    />
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid rgba(148, 163, 184, 0.2)', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        }}
                        itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                        labelStyle={{ color: '#475569', fontWeight: 500, marginBottom: '4px' }}
                    />
                    <Area 
                        type="monotone" 
                        name="Reported"
                        dataKey="reported" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorReported)" 
                    />
                    <Area 
                        type="monotone" 
                        name="Fixed"
                        dataKey="fixed" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorFixed)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function RatioStatBlock({ fixed, reported }: { fixed: number, reported: number }) {
    const ratio = reported === 0 ? 0 : Math.round((fixed / Math.max(reported, fixed)) * 100);
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 tracking-wide uppercase">Weekly Resolution Rate</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{ratio}%</p>
                    <span className="text-sm font-medium text-slate-500">Clear Rate</span>
                </div>
            </div>
            <div className="text-right space-y-1">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full inline-block">
                    {fixed} Resolved
                </p>
                <div className="h-1" />
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full inline-block">
                    {reported} Found
                </p>
            </div>
        </div>
    );
}
