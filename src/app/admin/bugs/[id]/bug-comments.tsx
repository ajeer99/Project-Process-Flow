'use client';

import { useState } from 'react';
import { addComment, togglePinComment } from '../../../lib/actions/bug';
import { User, Send, Pin, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Comment {
    id: string;
    text: string;
    isPinned: boolean;
    createdAt: Date | string;
    user: { id: string; name: string | null; email: string };
}

export default function BugComments({
    bugId,
    comments,
    currentUserId,
    currentUserRole
}: {
    bugId: string;
    comments: Comment[];
    currentUserId: string;
    currentUserRole: string;
}) {
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setIsSubmitting(true);
        const res = await addComment(bugId, text);
        setIsSubmitting(false);

        if (res.error) {
            alert(res.error);
        } else {
            setText('');
        }
    };

    const handlePin = async (commentId: string, currentPinStatus: boolean) => {
        await togglePinComment(commentId, bugId, !currentPinStatus);
    };

    const handleGeneratePin = async () => {
        setIsGenerating(true);
        try {
            // First we fetch the AI suggestion
            const response = await fetch('/api/ai/suggest-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bugId })
            });
            const data = await response.json();
            
            if (data.suggestion) {
                // Populate the text area so the user can review and edit before sending.
                // We do NOT auto-post using addComment()
                setText("🤖 AI Summary: " + data.suggestion);
            } else {
                alert("Failed to generate pin.");
            }
        } catch (error) {
            alert("Error connecting to AI.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Sort pinned comments to top
    const sortedComments = [...comments].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col mt-6">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Activity Thread & Comments
                </h3>
                <button
                    onClick={handleGeneratePin}
                    disabled={isGenerating}
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors border border-amber-200/50 dark:border-amber-500/20 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Draft AI Summary
                </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[500px] flex flex-col gap-6 bg-slate-50/30 dark:bg-transparent">
                {sortedComments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                        No comments yet. Start the conversation!
                    </div>
                ) : (
                    sortedComments.map(comment => (
                        <div key={comment.id} className={cn(
                            "group flex gap-4",
                            comment.isPinned ? "bg-amber-50 dark:bg-amber-500/5 -mx-4 p-4 rounded-xl border border-amber-100 dark:border-amber-500/20" : ""
                        )}>
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                    {(comment.user.name || comment.user.email)[0].toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                            {comment.user.name || comment.user.email.split('@')[0]}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">
                                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {comment.isPinned && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-sm">
                                                <Pin className="w-3 h-3" /> Pinned
                                            </span>
                                        )}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        {(currentUserRole === 'ADMIN' || currentUserId === comment.user.id) && (
                                            <button 
                                                onClick={() => handlePin(comment.id, comment.isPinned)}
                                                className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 p-1"
                                                title={comment.isPinned ? "Unpin Comment" : "Pin Comment"}
                                            >
                                                <Pin className={cn("w-3.5 h-3.5", comment.isPinned ? "fill-current text-amber-500" : "")} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !text.trim()}
                        className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">Press <kbd className="font-sans px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Enter</kbd> to send, <kbd className="font-sans px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Shift</kbd> + <kbd className="font-sans px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Enter</kbd> for new line.</p>
            </div>
        </div>
    );
}
