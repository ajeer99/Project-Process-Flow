'use client';

import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, sendTypingIndicator } from '../../lib/actions/chat';
import { Send, User as UserIcon, Loader2, Circle, CircleDashed, CircleDot, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

type UserContext = {
    id: string;
    name: string;
    email: string;
    presence: string;
    isOnline: boolean;
    avatarUrl: string | null;
    unreadCount?: number;
};

export function ChatLayout({ users, currentUserId }: { users: any[], currentUserId: string }) {
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [isPolishing, setIsPolishing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Typing debouncer
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [localUsers, setLocalUsers] = useState<UserContext[]>(users as UserContext[]);
    const activeUser = localUsers.find(u => u.id === activeUserId);

    // Initial messages load
    useEffect(() => {
        if (!activeUserId) return;
        let isMounted = true;
        setLoading(true);
        getMessages(activeUserId).then(res => {
            if (isMounted) {
                setLoading(false);
                if (res.success) {
                    setMessages(res.messages || []);
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
                }
            }
        });
        return () => { isMounted = false; };
    }, [activeUserId]);

    // Listen to Master Sync Event
    useEffect(() => {
        const handleSync = (e: any) => {
            if (e.detail?.users) {
                setLocalUsers(e.detail.users);
            }
            if (activeUserId) {
                getMessages(activeUserId).then(res => {
                    if (res.success) {
                        setMessages(res.messages || []);
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                });
            }
        };
        window.addEventListener('chat:sync', handleSync as EventListener);
        return () => window.removeEventListener('chat:sync', handleSync as EventListener);
    }, [activeUserId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !activeUserId) return;

        const contentToSend = text;
        setText('');
        setSending(true);

        // Cancel typing status immediately on send
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        sendTypingIndicator(activeUserId, false);

        const res = await sendMessage(activeUserId, contentToSend);
        if (res.success) {
            const fresh = await getMessages(activeUserId);
            if (fresh.success) {
                setMessages(fresh.messages || []);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        }
        setSending(false);
    };

    // Broadcast that I am typing...
    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (!activeUserId) return;

        // Broadcast "typing" true instantly (throttled by server or mostly overlapping ok)
        if (!typingTimeoutRef.current) {
             sendTypingIndicator(activeUserId, true);
        } else {
             clearTimeout(typingTimeoutRef.current);
        }

        // Set 2.5s timer to broadcast "stopped typing" if no more keys are pressed
        typingTimeoutRef.current = setTimeout(() => {
             sendTypingIndicator(activeUserId, false);
             typingTimeoutRef.current = null;
        }, 2500);
    };

    const handleAiPolish = async () => {
        if (!text.trim()) return;
        setIsPolishing(true);
        try {
            const res = await fetch('/api/ai/chat-assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type: 'polish' })
            });
            const data = await res.json();
            if (res.ok && data.result) {
                setText(data.result);
            } else {
                alert(`AI Polish Failed: ${data.error || 'Unknown Error'}`);
            }
        } catch (e) {
            console.error("Failed to polish text", e);
            alert("Failed to connect to AI service.");
        } finally {
            setIsPolishing(false);
        }
    };

    const getPresenceIcon = (presence: string) => {
        switch (presence) {
            case 'ONLINE': return <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />;
            case 'BUSY': return <CircleDot className="w-3 h-3 text-rose-500 fill-rose-500" />;
            default: return <CircleDashed className="w-3 h-3 text-slate-400" />;
        }
    };

    return (
        <div className="flex h-full w-full">
            {/* Sidebar List */}
            <div className={cn("w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900", activeUserId ? "hidden md:flex" : "flex")}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Directory</h2>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {localUsers.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => setActiveUserId(user.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                                activeUserId === user.id 
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20" 
                                    : "hover:bg-white dark:hover:bg-slate-800 border border-transparent"
                            )}
                        >
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-indigo-400" />
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                                    {getPresenceIcon(user.presence)}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                                    {(user.unreadCount || 0) > 0 && (
                                        <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                                            {user.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </button>
                    ))}
                    {localUsers.length === 0 && (
                        <div className="p-4 text-sm text-center text-slate-500">No other users found.</div>
                    )}
                </div>
            </div>

            {/* Chat Thread */}
            <div className={cn("flex-1 flex col", activeUserId ? "flex" : "hidden md:flex")}>
                {!activeUserId ? (
                    <div className="flex-1 flex items-center justify-center flex-col gap-2 relative">
                        {/* Empty State */}
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Send className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-slate-500 font-medium">Select a user to start chatting</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900">
                            <button className="md:hidden text-indigo-600 font-medium text-sm" onClick={() => setActiveUserId(null)}>
                                &larr; Back
                            </button>
                            <div className="flex items-center gap-2">
                                {getPresenceIcon(activeUser?.presence || 'OFFLINE')}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{activeUser?.name}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/50">
                            {loading && messages.length === 0 ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.senderId === currentUserId;
                                    const showTime = i === 0 || new Date(msg.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 10 * 60 * 1000;
                                    
                                    return (
                                        <div key={msg.id} className="flex flex-col">
                                            {showTime && (
                                                <div className="flex justify-center mb-4 mt-2">
                                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                        {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                                    isMe 
                                                        ? "bg-indigo-600 text-white rounded-br-sm" 
                                                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-sm"
                                                )}>
                                                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} className="h-1" />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                            <form onSubmit={handleSend} className="flex items-end gap-2 relative">
                                <textarea
                                    value={text}
                                    onChange={handleTyping}
                                    placeholder="Type a message..."
                                    className="flex-1 max-h-32 min-h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:text-white"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 right-[4.5rem]">
                                    <button
                                        type="button"
                                        onClick={handleAiPolish}
                                        title="AI Polish & Enhance"
                                        disabled={!text.trim() || isPolishing || sending}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
                                    >
                                        {isPolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!text.trim() || sending}
                                    className="shrink-0 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 shrink-0 pr-0.5" />}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
