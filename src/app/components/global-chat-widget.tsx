'use client';

import { useState, useEffect, useRef } from 'react';
import { getChatUsers, getMessages, sendMessage, sendTypingIndicator } from '../lib/actions/chat';
import { MessageCircle, X, Send, User as UserIcon, Loader2, Circle, CircleDot, CircleDashed, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
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

export function GlobalChatWidget({ currentUserId }: { currentUserId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<UserContext[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    
    // Typing debouncer
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const activeUser = users.find(u => u.id === activeUserId);

    // Fetch users when widget is opened
    useEffect(() => {
        if (!isOpen || !currentUserId) return;
        getChatUsers().then(res => {
            if (res.success && res.users) {
                setUsers(res.users as any[]);
            }
        });
    }, [isOpen, currentUserId]);

    // Fetch messages initially when a user is selected
    useEffect(() => {
        if (!isOpen || !activeUserId) return;
        let isMounted = true;
        setLoadingMsgs(true);
        getMessages(activeUserId).then(res => {
            if (isMounted) {
                setLoadingMsgs(false);
                if (res.success) {
                    setMessages(res.messages || []);
                    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
                }
            }
        });
        return () => { isMounted = false; };
    }, [isOpen, activeUserId]);

    // Listen to Master Sync Event
    useEffect(() => {
        const handleSync = (e: any) => {
            if (e.detail?.users) {
                setUsers(e.detail.users);
            }
            if (isOpen && activeUserId) {
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
    }, [isOpen, activeUserId]);

    // Handle sending message
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

        await sendMessage(activeUserId, contentToSend);
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

    if (!currentUserId) return null;

    const getPresenceIcon = (presence: string) => {
        switch (presence) {
            case 'ONLINE': return <Circle className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />;
            case 'BUSY': return <CircleDot className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />;
            default: return <CircleDashed className="w-2.5 h-2.5 text-slate-400" />;
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Pop-up Window */}
            {isOpen && (
                <div className="w-80 sm:w-96 h-[32rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl mb-4 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
                    
                    {/* Header */}
                    <div className="h-14 bg-indigo-600 px-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-2">
                            {activeUserId && (
                                <button onClick={() => setActiveUserId(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h3 className="font-semibold text-sm">
                                {activeUserId ? activeUser?.name : "Direct Messages"}
                            </h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-hidden relative">
                        {!activeUserId ? (
                            /* User List */
                            <div className="h-full overflow-y-auto p-2 space-y-1 bg-slate-50 dark:bg-slate-900/50">
                                {users.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500">Loading directory...</div>
                                ) : (
                                    users.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => setActiveUserId(user.id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 text-slate-400">
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-indigo-400" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
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
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Chat Thread */
                            <div className="h-full flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {loadingMsgs && messages.length === 0 ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                        </div>
                                    ) : (
                                        messages.map((msg, i) => {
                                            const isMe = msg.senderId === currentUserId;
                                            return (
                                                <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                                    <div className={cn(
                                                        "max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm",
                                                        isMe 
                                                            ? "bg-indigo-600 text-white rounded-br-sm" 
                                                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-sm"
                                                    )}>
                                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={bottomRef} className="h-1" />
                                </div>
                                {/* Input Area */}
                                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                    <form onSubmit={handleSend} className="flex gap-2">
                                        <textarea
                                            value={text}
                                            onChange={handleTyping}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!text.trim() || sending}
                                            className="shrink-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    );
}
