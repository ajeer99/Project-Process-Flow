'use client';

import { Download } from 'lucide-react';

interface ExportButtonProps {
    data: any[];
    filename: string;
    className?: string;
}

export function ExportButton({ data, filename, className }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        // Flatten data logic to handle nested objects simply
        const flattenObject = (obj: any, prefix = ''): any => {
            return Object.keys(obj).reduce((acc: any, k: string) => {
                const pre = prefix.length ? prefix + '.' : '';
                if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                    if (obj[k] instanceof Date) {
                        acc[pre + k] = obj[k].toISOString();
                    } else {
                        Object.assign(acc, flattenObject(obj[k], pre + k));
                    }
                } else if (Array.isArray(obj[k])) {
                    acc[pre + k] = `[${obj[k].length} items]`;
                } else {
                    acc[pre + k] = obj[k];
                }
                return acc;
            }, {});
        };

        const flattenedData = data.map(row => flattenObject(row));
        
        // Extract headers from the first item
        const headers = Object.keys(flattenedData[0]);
        
        // Build CSV string
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of flattenedData) {
            const values = headers.map(header => {
                let val = row[header];
                if (val === null || val === undefined) return '';
                // Escape quotes and wrap in quotes
                const stringVal = String(val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className={`inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
        >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel/CSV</span>
            <span className="sm:hidden">Export</span>
        </button>
    );
}
