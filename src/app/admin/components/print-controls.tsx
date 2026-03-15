import { Printer, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PrintControls() {
    const router = useRouter();

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        // Try to close window first if it was opened in a new tab via target="_blank"
        window.close();
        // Fallback for same-tab navigation
        router.back();
    };

    return (
        <div className="flex items-center gap-3 print:hidden mb-6 mt-4 ml-4">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-transparent rounded-xl text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Report</span>
            </button>
            <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
            </button>
        </div>
    );
}
