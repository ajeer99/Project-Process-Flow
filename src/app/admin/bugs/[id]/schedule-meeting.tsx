'use client';

import { CalendarPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ScheduleMeeting({
    bugId,
    bugTitle,
    projectName,
    testerEmail,
    developerEmail
}: {
    bugId: string;
    bugTitle: string;
    projectName: string;
    testerEmail: string;
    developerEmail?: string | null;
}) {
    const [pageUrl, setPageUrl] = useState('');

    useEffect(() => {
        setPageUrl(window.location.href);
    }, []);

    const handleSchedule = () => {
        const title = encodeURIComponent(`Bug Triage: [${projectName}] ${bugTitle}`);
        const details = encodeURIComponent(`Let's meet to discuss the follow bug and triage our next steps.\n\nBug Link: ${pageUrl}`);
        const attendees = [testerEmail, developerEmail].filter(Boolean).join(',');
        
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&add=${attendees}`;
        window.open(gcalUrl, '_blank');
    };

    return (
        <button
            onClick={handleSchedule}
            className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl font-medium transition-colors text-sm"
        >
            <CalendarPlus className="w-4 h-4" />
            Schedule Meeting
        </button>
    );
}
