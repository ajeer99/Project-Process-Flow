'use client';

import { useEffect } from 'react';
import { updateHeartbeat } from '../lib/actions/activity';

export function ActivityTracker() {
    useEffect(() => {
        // Ping immediately on mount
        updateHeartbeat();

        // Ping every 1 minute
        const interval = setInterval(() => {
            updateHeartbeat();
        }, 60 * 1000);

        // Ping on visibility change (e.g. coming back to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateHeartbeat();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // This component renders nothing, it purely functions as a background task.
    return null;
}
