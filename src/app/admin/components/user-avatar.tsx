import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UserAvatarProps {
    src?: string | null;
    name?: string | null;
    email?: string | null;
    className?: string;
    size?: number;
}

export function UserAvatar({ src, name, email, className, size = 32 }: UserAvatarProps) {
    const initials = (name || email || '?').substring(0, 1).toUpperCase();

    return (
        <div 
            className={cn(
                "relative flex items-center justify-center shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 overflow-hidden font-semibold",
                className
            )}
            style={{ width: size, height: size }}
        >
            {src ? (
                <Image 
                    src={src} 
                    alt={name || email || 'Avatar'} 
                    fill 
                    className="object-cover"
                />
            ) : (
                <span style={{ fontSize: `${Math.max(10, size * 0.4)}px` }}>{initials}</span>
            )}
        </div>
    );
}
