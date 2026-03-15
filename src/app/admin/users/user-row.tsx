'use client';

import { useState } from 'react';
import { User, Role } from '@prisma/client';
import { updateUserRole, suspendUser, deleteUser, resetUserPassword, toggleUserNotifications, toggleUserReportAccess } from '../../lib/actions/user';
import { Check, Loader2, ShieldAlert, Ban, Trash2, CheckCircle2, KeyRound, Edit, Mail, MailWarning, BarChart2 } from 'lucide-react';
import Link from 'next/link';

interface UserRowProps {
    user: User & { canViewReports?: boolean, liveSessionMinutes?: number };
}

export function UserRow({ user }: UserRowProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentRole, setCurrentRole] = useState<Role>(user.role);
    const [showSuccess, setShowSuccess] = useState(false);

    const formatSessionTime = (mins: number) => {
        if (!mins) return '0h 0m';
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return `${h}h ${m}m`;
    };

    const handleRoleChange = async (newRole: Role) => {
        if (newRole === currentRole) return;
        
        setIsUpdating(true);
        setShowSuccess(false);
        try {
            const result = await updateUserRole(user.id, newRole);
            if (result.success) {
                setCurrentRole(newRole);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            } else {
                alert('Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('An unexpected error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSuspendToggle = async () => {
        setIsUpdating(true);
        // @ts-ignore - TS Cache lag
        const res = await suspendUser(user.id, user.isActive ?? true);
        if (!res.success) alert(res.error || 'Failed to update user status');
        setIsUpdating(false);
    };

    const handleNotificationToggle = async () => {
        setIsUpdating(true);
        const res = await toggleUserNotifications(user.id, user.notificationsEnabled);
        if (!res.success) alert(res.error || 'Failed to update notification status');
        setIsUpdating(false);
    };
    
    const handleReportAccessToggle = async () => {
        setIsUpdating(true);
        const res = await toggleUserReportAccess(user.id, user.canViewReports || false);
        if (!res.success) alert(res.error || 'Failed to update report access status');
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to permanently delete ${user.name}? This cannot be undone.`)) return;
        setIsUpdating(true);
        const res = await deleteUser(user.id);
        if (!res.success) alert(res.error || 'Failed to delete user');
        setIsUpdating(false);
    };

    const handleResetPassword = async () => {
        if (!confirm(`Are you sure you want to reset the password for ${user.name}? They will be emailed a temporary login.`)) return;
        setIsUpdating(true);
        const res = await resetUserPassword(user.id);
        if (!res.success) {
            alert(res.error || 'Failed to reset password');
        } else {
            alert(res.message);
        }
        setIsUpdating(false);
    };

    const roles: Role[] = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER'];

    // @ts-ignore - TS Cache lag
    const isActive = user.isActive ?? true;

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 justify-start dark:text-white flex items-center gap-2">
                        {user.name}
                        {currentRole === 'ADMIN' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                        {!isActive && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">SUSPENDED</span>}
                    </span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="relative inline-block text-left w-40">
                    <select
                        value={currentRole}
                        onChange={(e) => handleRoleChange(e.target.value as Role)}
                        disabled={isUpdating}
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700 disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22lucide%20lucide-chevron-down%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px]"
                    >
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0) + role.slice(1).toLowerCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-medium">
                {formatSessionTime(user.liveSessionMinutes || 0)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2 h-8">
                    {isUpdating && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    {showSuccess && <Check className="w-4 h-4 text-emerald-500" />}
                    
                    <Link
                        href={`/admin/users/edit/${user.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Edit User"
                    >
                        <Edit className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={handleResetPassword}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                        title="Reset Password"
                    >
                        <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleReportAccessToggle}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-500 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors disabled:opacity-50"
                        title={user.canViewReports ? "Disable Report Access" : "Enable Report Access"}
                    >
                        <BarChart2 className={`w-4 h-4 ${!user.canViewReports ? "text-slate-300" : ""}`} />
                    </button>
                    <button
                        onClick={handleNotificationToggle}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-500 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                        title={user.notificationsEnabled ? "Disable Emails" : "Enable Emails"}
                    >
                        {user.notificationsEnabled ? <Mail className="w-4 h-4" /> : <MailWarning className="w-4 h-4 text-slate-300" />}
                    </button>
                    <button
                        onClick={handleSuspendToggle}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                        title={isActive ? "Suspend User" : "Activate User"}
                    >
                        {isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isUpdating}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Delete User"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
