'use client';

import { useEffect, useState } from 'react';

export function ChatNotifier() {
    const [typingUser, setTypingUser] = useState<{name: string, avatar: string | null} | null>(null);

    useEffect(() => {
        let isMounted = true;
        let eventSource: EventSource | null = null;
        let typingTimeout: NodeJS.Timeout;

        const connectStream = () => {
            if (!isMounted) return;
            eventSource = new EventSource('/api/chat/stream');

            eventSource.addEventListener('message', (e) => {
                const data = JSON.parse(e.data);
                playNotificationSound();
                // Tell the whole app to refresh users/unread counts
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('chat:sync', { detail: { forcedRefresh: true } }));
                }
            });

            eventSource.addEventListener('typing', (e) => {
                const data = JSON.parse(e.data);
                if (data.isTyping) {
                    setTypingUser({ name: data.senderName, avatar: data.senderAvatar });
                    
                    // Auto dismiss the typing toast after 3 seconds of silence
                    clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => {
                        setTypingUser(null);
                    }, 3000);
                } else {
                    setTypingUser(null);
                    clearTimeout(typingTimeout);
                }
            });

            eventSource.addEventListener('notification', (e) => {
                playNotificationSound();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('notification:refresh'));
                }
            });

            eventSource.onerror = () => {
                eventSource?.close();
                // Reconnect after 5 seconds on failure
                if (isMounted) setTimeout(connectStream, 5000);
            };
        };

        connectStream();

        return () => {
            isMounted = false;
            eventSource?.close();
            clearTimeout(typingTimeout);
        };
    }, []);

    const playNotificationSound = () => {
        try {
            // Use Web Audio API for a guaranteed synthesized "ping" to bypass missing mp3s
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            
            // Resume context if browser autoplay policy suspended it
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // High pitch (A5)
            oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02); // Quick fade in
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); // Longer fade out

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.4);
            
            // Clean up
            setTimeout(() => {
                ctx.close();
            }, 500);

        } catch (e) {
            console.error("Could not play synthesized notification sound", e);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-50 pointer-events-none flex flex-col items-end gap-2">
            {typingUser && (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                        {typingUser.avatar ? (
                            <img src={typingUser.avatar} alt={typingUser.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-indigo-50 dark:bg-slate-700 text-xs font-bold">
                                {typingUser.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{typingUser.name}</p>
                        <p className="text-[10px] text-indigo-500 font-medium flex items-center gap-1 mt-0.5">
                            typing<span className="animate-pulse">...</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
