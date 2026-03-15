'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/app/admin/components/ui/dialog";
import { ExternalLink, X, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface MediaPreviewProps {
    url: string;
    type: 'image' | 'video';
    label: string;
}

export function MediaPreview({ url, type, label }: MediaPreviewProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Some URLs might be external. This simple check assumes relative URLs 
    // or standard image/video extensions can be previewed natively. 
    // We'll render an image or video tag based on the 'type' prop.

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div 
                    role="button" 
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsOpen(true);
                        }
                    }}
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer p-1 -m-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                    {type === 'image' ? <ImageIcon className="w-4 h-4 shrink-0" /> : <VideoIcon className="w-4 h-4 shrink-0" />}
                    <span className="truncate max-w-[200px] hover:underline underline-offset-2">{label}</span>
                </div>
            </DialogTrigger>
            
            <DialogContent className="max-w-5xl w-[90vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-slate-800 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0 border-b border-white/10">
                    <DialogTitle className="text-white text-sm font-medium flex items-center gap-2">
                        {type === 'image' ? <ImageIcon className="w-4 h-4 text-slate-400" /> : <VideoIcon className="w-4 h-4 text-slate-400" />}
                        {label}
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="ml-2 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors group"
                            title="Open original file"
                        >
                            <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        </a>
                    </DialogTitle>
                    <DialogClose className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </DialogClose>
                </div>
                
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[url('/bg-grid.svg')] bg-center relative">
                    {/* Subtle grid pattern background for the preview area */}
                    <div className="absolute inset-0 bg-black/50" />
                    
                    <div className="relative z-10 max-w-full max-h-full flex items-center justify-center shadow-2xl">
                        {type === 'image' ? (
                            <img 
                                src={url} 
                                alt={label} 
                                className="max-w-full max-h-full object-contain rounded-md"
                            />
                        ) : (
                            <video 
                                src={url} 
                                controls 
                                autoPlay
                                className="max-w-full max-h-[70vh] rounded-md outline-none focus:ring-2 focus:ring-indigo-500 ring-offset-2 ring-offset-black"
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

