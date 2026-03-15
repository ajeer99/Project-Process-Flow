'use client';

import { useEffect } from 'react';
import { FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { PrintControls } from '../../../../components/print-controls';

export function AuditReport({ project }: { project: any }) {
    const bugs = project.bugs || [];

    // Auto-print prompt on load removed based on user preference and replaced with explicit PrintControls

    const pageClasses = "max-w-4xl mx-auto bg-white p-8 print:p-0 print:max-w-none print:w-full min-h-screen text-slate-900";

    return (
        <div className="bg-slate-100 min-h-screen py-8 print:py-0 print:bg-white print:w-full print:m-0">
            <div className="max-w-4xl mx-auto print:hidden">
                <PrintControls />
            </div>
            {/* Page 1 onwards: Audit Log */}
            <div className={`${pageClasses}`}>
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <div className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-2">Issue Audit Log</div>
                        <h1 className="text-4xl font-extrabold text-slate-900">{project.name}</h1>
                        <p className="text-slate-600 mt-2 max-w-2xl">{project.description || 'Complete log of all tracked issues.'}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Generated On</div>
                        <div className="font-bold text-slate-900 text-lg">{format(new Date(), 'MMM dd, yyyy')}</div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium border border-slate-200">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            {bugs.length} Issues
                        </div>
                    </div>
                </div>

                {/* Audit Log Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 border-b border-slate-300">
                            <tr>
                                <th className="px-3 py-3 font-bold text-slate-800">Issue ID / Title</th>
                                <th className="px-3 py-3 font-bold text-slate-800">Severity</th>
                                <th className="px-3 py-3 font-bold text-slate-800">Status</th>
                                <th className="px-3 py-3 font-bold text-slate-800">Reporter</th>
                                <th className="px-3 py-3 font-bold text-slate-800">Developer</th>
                                <th className="px-3 py-3 font-bold text-slate-800">Tester</th>
                                <th className="px-3 py-3 font-bold text-slate-800">Date Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {bugs.length > 0 ? bugs.map((bug: any) => (
                                <tr key={bug.id} className="bg-white break-inside-avoid">
                                    <td className="px-3 py-3 max-w-[200px]">
                                        <div className="font-mono text-[10px] text-slate-500 mb-0.5">{bug.id.substring(bug.id.length - 6)}</div>
                                        <div className="font-medium text-slate-900 truncate" title={bug.title}>{bug.title}</div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`font-semibold ${
                                            bug.severity === 'CRITICAL' ? 'text-red-600' :
                                            bug.severity === 'HIGH' ? 'text-orange-600' :
                                            bug.severity === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                                        }`}>{bug.severity}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`font-semibold ${
                                            ['FIXED', 'VERIFIED'].includes(bug.status) ? 'text-emerald-600' : 'text-slate-600'
                                        }`}>{bug.status}</span>
                                    </td>
                                    <td className="px-3 py-3 text-slate-700">{bug.creator?.name || '-'}</td>
                                    <td className="px-3 py-3 text-slate-700">{(bug.resolvedBy || bug.developer)?.name || '-'}</td>
                                    <td className="px-3 py-3 text-slate-700">{(bug.verifiedBy || bug.tester)?.name || '-'}</td>
                                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{format(new Date(bug.updatedAt), 'MMM dd, yyyy')}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No issues recorded for this project.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
