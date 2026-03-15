'use client';

import { useState } from 'react';
import { assignBug } from '../../../lib/actions/bug';
import { UserPlus, Loader2 } from 'lucide-react';

export default function BugAssignmentDropdown({ 
    bugId, 
    currentAssigneeId,
    currentGroupId,
    developers,
    groups,
    userRole
}: { 
    bugId: string, 
    currentAssigneeId: string | null,
    currentGroupId: string | null,
    developers: { id: string, name: string | null, email: string }[],
    groups: { id: string, name: string, type: string }[],
    userRole: string
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    
    const currentValue = currentGroupId ? `group:${currentGroupId}` : (currentAssigneeId || '');
    
    const unassignedOption = { id: '', name: 'Unassigned', email: '' };
    const allOptions = [unassignedOption, ...developers];
    const devGroups = groups.filter(g => g.type === 'DEVELOPER');

    const handleAssign = async (value: string) => {
        setIsUpdating(true);
        let devId = null;
        let groupId = null;
        if (value.startsWith('group:')) {
            groupId = value.split(':')[1];
        } else if (value) {
            devId = value;
        }

        try {
            await assignBug(bugId, devId, groupId);
        } catch (error) {
            console.error('Failed to assign bug:', error);
            alert('Failed to assign developer.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="relative">
            {isUpdating && (
                <div className="absolute inset-y-0 right-8 flex items-center pr-2 pointer-events-none">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                </div>
            )}
            <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-400" />
                <select
                    value={currentValue}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={isUpdating || (!['ADMIN', 'PROJECT_MANAGER'].includes(userRole) && userRole !== 'DEVELOPER')}
                    className="flex-1 w-full text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-3 pr-8 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none  bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%24%24%24%2024%22%20fill%3D%22none%22%20stroke%3D%22gray%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:16px_16px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <option value="">Unassigned</option>
                    <optgroup label="Groups">
                        {devGroups.map((g) => (
                            <option key={`g-${g.id}`} value={`group:${g.id}`}>
                                Group: {g.name}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Developers">
                        {developers.map((dev) => (
                            <option key={dev.id} value={dev.id}>
                                Developer: {dev.name || dev.email}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>
        </div>
    );
}
