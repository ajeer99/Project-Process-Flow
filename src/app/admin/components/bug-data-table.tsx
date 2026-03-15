'use client';

import { useState, useMemo } from 'react';
import { updateBugStatus } from '../../lib/actions/bug';
import { Search, ChevronUp, ChevronDown, Package, GitPullRequestDraft, Clock, MoreHorizontal, FileText, Filter, ArrowUpRight, CheckCircle2, AlignLeft } from 'lucide-react';
import Link from 'next/link';
import { BugPinButton } from '../../components/bug-pin-button';
import { UserAvatar } from './user-avatar';

interface Bug {
    id: string;
    title: string;
    status: string;
    severity: string;
    updatedAt: string | Date;
    module: { name: string; project: { name: string } };
    subModule?: { name: string } | null;
    build: { version: string };
    developer?: { name: string | null; email: string, avatarUrl?: string | null } | null;
    tester?: { name: string | null; email: string, avatarUrl?: string | null } | null;
    isPinned: boolean;
    description?: string;
}

function DataTableRow({ bug, role, statusOptions, allStatuses, statusColors, severityColors, updatingId, handleStatusChange }: { 
    bug: Bug, 
    role: string, 
    statusOptions: string[], 
    allStatuses: string[], 
    statusColors: Record<string, string>, 
    severityColors: Record<string, string>, 
    updatingId: string | null, 
    handleStatusChange: (id: string, status: string) => void 
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr 
                className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center">
                        <BugPinButton bugId={bug.id} initialPinned={bug.isPinned} />
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${severityColors[bug.severity] || severityColors.LOW}`}>
                        {bug.severity}
                    </span>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <button className="text-slate-400 hover:text-indigo-500 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <Link href={`/admin/bugs/${bug.id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <span className="truncate max-w-[280px] lg:max-w-md">{bug.title}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </Link>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-1 flex gap-2 items-center pl-7">
                            <span>#{bug.id.split('-')[0]}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                            <span className="truncate max-w-[200px] flex items-center gap-1.5">
                                {role === 'DEVELOPER' && bug.tester && (
                                    <>
                                        Reported by:
                                        <UserAvatar src={bug.tester.avatarUrl} name={bug.tester.name} email={bug.tester.email} size={14} className="ml-0.5" />
                                        <span className="truncate">{(bug.tester.name || bug.tester.email.split('@')[0])}</span>
                                    </>
                                )}
                                {role === 'TESTER' && bug.developer && (
                                    <>
                                        Assigned to:
                                        <UserAvatar src={bug.developer.avatarUrl} name={bug.developer.name} email={bug.developer.email} size={14} className="ml-0.5" />
                                        <span className="truncate">{(bug.developer.name || bug.developer.email.split('@')[0])}</span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Package className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[140px]">{bug.module.project.name}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[140px]">
                                {bug.module.name} {bug.subModule && `> ${bug.subModule.name}`}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {new Date(bug.updatedAt).toLocaleDateString()}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                        {updatingId === bug.id && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-[1px] rounded-lg z-10 flex items-center px-3 gap-2 border border-indigo-100 dark:border-indigo-900">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Updating...</span>
                            </div>
                        )}
                        <select
                            value={bug.status}
                            onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border appearance-none w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${statusColors[bug.status] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}
                            style={{
                                backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '12px 12px'
                            }}
                        >
                            {role === 'DEVELOPER' && !statusOptions.includes(bug.status) && (
                                <option value={bug.status} disabled>{bug.status.replace(/_/g, ' ')}</option>
                            )}
                            <optgroup label="Quick Actions">
                                {statusOptions.map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </optgroup>
                            <optgroup label="All Statuses">
                                {allStatuses.map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
                    <td colSpan={6} className="px-6 py-4">
                        <div className="pl-12 pr-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                    <AlignLeft className="w-3.5 h-3.5" />
                                    Issue Description
                                </h4>
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {bug.description || <span className="text-slate-400 italic">No description provided.</span>}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export function BugDataTable({ bugs, role }: { bugs: Bug[], role: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'updatedAt', direction: 'desc' });
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const handleStatusChange = async (bugId: string, newStatus: string) => {
        setUpdatingId(bugId);
        try {
            await updateBugStatus(bugId, newStatus);
        } catch (error) {
            console.error('Failed to change status:', error);
            alert('Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const statusOptions = role === 'DEVELOPER' 
        ? ['IN_PROGRESS', 'READY_FOR_RETEST', 'NEED_MORE_INFO', 'OPEN'] 
        : ['VERIFIED', 'REOPENED', 'NEED_MORE_INFO', 'READY_FOR_RETEST'];
    
    const allStatuses = ['OPEN', 'IN_PROGRESS', 'NEED_MORE_INFO', 'FIXED', 'READY_FOR_RETEST', 'VERIFIED', 'REOPENED'];

    const severityColors: Record<string, string> = {
        CRITICAL: "text-rose-600 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400",
        HIGH: "text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400",
        MEDIUM: "text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400",
        LOW: "text-slate-600 bg-slate-100 dark:bg-slate-500/20 dark:text-slate-400",
    };

    const statusColors: Record<string, string> = {
        OPEN: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200",
        IN_PROGRESS: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 border-sky-200",
        NEED_MORE_INFO: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200",
        READY_FOR_RETEST: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200",
        VERIFIED: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200",
        REOPENED: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200",
        FIXED: "text-teal-600 bg-teal-50 dark:bg-teal-500/10 border-teal-200",
    };

    // Filter AND Sort Data
    const processedBugs = useMemo(() => {
        let sortableItems = [...bugs];

        // 1. Search Filter
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            sortableItems = sortableItems.filter(bug => 
                bug.title.toLowerCase().includes(lowercasedSearch) ||
                bug.id.toLowerCase().includes(lowercasedSearch) ||
                bug.module.project.name.toLowerCase().includes(lowercasedSearch) ||
                bug.module.name.toLowerCase().includes(lowercasedSearch)
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL') {
            sortableItems = sortableItems.filter(bug => bug.status === statusFilter);
        }

        // 3. Severity Filter
        if (severityFilter !== 'ALL') {
            sortableItems = sortableItems.filter(bug => bug.severity === severityFilter);
        }

        // 4. Sorting
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Bug];
                let bValue: any = b[sortConfig.key as keyof Bug];

                // Handle nested string resolutions
                if (sortConfig.key === 'module') {
                    aValue = a.module.name + (a.subModule ? ` > ${a.subModule.name}` : '');
                    bValue = b.module.name + (b.subModule ? ` > ${b.subModule.name}` : '');
                } else if (sortConfig.key === 'project') {
                    aValue = a.module.project.name;
                    bValue = b.module.project.name;
                } else if (sortConfig.key === 'date') {
                    aValue = new Date(a.updatedAt).getTime();
                    bValue = new Date(b.updatedAt).getTime();
                } else if (sortConfig.key === 'severity') {
                    // Custom severity sorting
                    const severityRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    aValue = severityRank[a.severity] || 0;
                    bValue = severityRank[b.severity] || 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return sortableItems;
    }, [bugs, sortConfig, searchTerm, statusFilter, severityFilter]);

    // Format display helpers
    const getSortIcon = (columnName: string) => {
        if (!sortConfig || sortConfig.key !== columnName) {
            return <ChevronUp className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
        }
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="w-4 h-4 text-indigo-500" />
            : <ChevronDown className="w-4 h-4 text-indigo-500" />;
    };

    // Calculate Pagination
    const totalPages = Math.ceil(processedBugs.length / itemsPerPage);
    const paginatedBugs = processedBugs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset pagination on filter change
    useMemo(() => { setCurrentPage(1); }, [searchTerm, statusFilter, severityFilter]);

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tickets by ID, title, or module..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-col sm:flex-row">
                        <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                        <select 
                            className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer w-full sm:w-auto"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            {allStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2"></div>
                    <select 
                        className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer w-full sm:w-auto"
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th scope="col" className="w-[80px] px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Pin
                            </th>
                            <th scope="col" className="w-[120px] px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group" onClick={() => requestSort('severity')}>
                                <div className="flex items-center gap-1">Severity {getSortIcon('severity')}</div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group" onClick={() => requestSort('title')}>
                                <div className="flex items-center gap-1">Bug Title {getSortIcon('title')}</div>
                            </th>
                            <th scope="col" className="w-[200px] px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group hidden md:table-cell" onClick={() => requestSort('module')}>
                                <div className="flex items-center gap-1">Project / Module {getSortIcon('module')}</div>
                            </th>
                            <th scope="col" className="w-[180px] px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group hidden xl:table-cell" onClick={() => requestSort('date')}>
                                <div className="flex items-center gap-1">Last Updated {getSortIcon('date')}</div>
                            </th>
                            <th scope="col" className="w-[220px] px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer group" onClick={() => requestSort('status')}>
                                <div className="flex items-center gap-1">Status {getSortIcon('status')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {paginatedBugs.map((bug) => (
                            <DataTableRow 
                                key={bug.id} 
                                bug={bug} 
                                role={role} 
                                statusOptions={statusOptions} 
                                allStatuses={allStatuses} 
                                statusColors={statusColors} 
                                severityColors={severityColors} 
                                updatingId={updatingId} 
                                handleStatusChange={handleStatusChange} 
                            />
                        ))}
                    </tbody>
                </table>
                
                {paginatedBugs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No bugs found</h3>
                        <p className="text-slate-500 max-w-sm">
                            {searchTerm || statusFilter !== 'ALL' || severityFilter !== 'ALL' 
                                ? "We couldn't find any bugs matching your current filters. Try relaxing your search terms."
                                : "There are no bugs assigned to this workspace right now. Enjoy your clean slate!"}
                        </p>
                        {(searchTerm || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
                            <button 
                                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setSeverityFilter('ALL'); }}
                                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, processedBugs.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{processedBugs.length}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
