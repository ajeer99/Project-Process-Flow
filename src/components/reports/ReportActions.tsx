'use client';

import { Download, Printer } from 'lucide-react';

interface ReportActionsProps {
    data: any[];
    filename: string;
    columns: { header: string, key: string }[];
}

export function ReportActions({ data, filename, columns }: ReportActionsProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        // Create CSV Header
        const headerRow = columns.map(c => `"${c.header}"`).join(',');
        
        // Create CSV Body
        const bodyRows = data.map(row => {
            return columns.map(col => {
                const val = row[col.key];
                // Escape quotes and wrap in quotes
                const formattedVal = val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '';
                return `"${formattedVal}"`;
            }).join(',');
        });

        const csvContent = [headerRow, ...bodyRows].join('\n');
        
        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handlePrint}
                className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors print:hidden"
                aria-label="Print Report"
                title="Print Report"
            >
                <Printer className="w-5 h-5" />
            </button>
            <button
                onClick={handleExport}
                disabled={!data || data.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-transparent text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
            >
                <Download className="w-4 h-4" />
                Export CSV
            </button>
        </div>
    );
}
