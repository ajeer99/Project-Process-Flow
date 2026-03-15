'use client';

import { Calendar, Printer, FileText, ChevronDown, Activity, Settings2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface PrintReportControlsProps {
    reportUrl: string;
    auditUrl: string;
}

export function PrintReportControls({ reportUrl, auditUrl }: PrintReportControlsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [reportType, setReportType] = useState<'analytics' | 'audit'>('analytics');
    
    // Add ref for clicking outside to close
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handlePrint = () => {
        const query = new URLSearchParams();
        if (start) query.set('start', start);
        if (end) query.set('end', end);
        const queryString = query.toString() ? `?${query.toString()}` : '';
        
        const targetUrl = reportType === 'analytics' ? reportUrl : auditUrl;
        const fullUrl = `${targetUrl}${queryString}`;
        
        window.open(fullUrl, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
            >
                <Printer className="w-4 h-4" />
                Print Reports
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-indigo-500" /> Report Configuration
                        </h3>
                    </div>

                    <div className="p-4 space-y-5 flex flex-col">
                        {/* Report Type */}
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Report Type</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button 
                                    onClick={() => setReportType('analytics')}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${reportType === 'analytics' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'}`}
                                >
                                    <Activity className="w-3.5 h-3.5" /> Analytics
                                </button>
                                <button 
                                    onClick={() => setReportType('audit')}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${reportType === 'audit' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" /> Audit Log
                                </button>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Date Filter (Optional)</label>
                                {(start || end) && (
                                    <button 
                                        onClick={() => { setStart(''); setEnd(''); }}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={start}
                                            onChange={(e) => setStart(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-xs outline-none transition-colors dark:text-white"
                                            title="Start Date"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 text-center">Start Date</p>
                                </div>
                                <div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={end}
                                            onChange={(e) => setEnd(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-xs outline-none transition-colors dark:text-white"
                                            title="End Date"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 text-center">End Date</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Generate Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
