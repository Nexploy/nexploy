'use client';

import { cn } from '@workspace/ui/lib/utils';

interface AnimatedBanProps {
    className?: string;
}

export function AnimatedBan({ className }: AnimatedBanProps) {
    return (
        <svg className={cn('animate-node-pop-in', className)} viewBox="0 0 16 16" fill="none">
            <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="41"
                style={{ '--path-length': '41' } as React.CSSProperties}
                className="animate-[node-draw-path_0.4s_ease-out_both]"
            />
            <line
                x1="3.4"
                y1="12.6"
                x2="12.6"
                y2="3.4"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="14"
                style={{ '--path-length': '14' } as React.CSSProperties}
                className="animate-[node-draw-path_0.3s_ease-out_0.35s_both]"
            />
        </svg>
    );
}
