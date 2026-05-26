'use client';

import { cn } from '@workspace/ui/lib/utils';

interface AnimatedCircleXProps {
    className?: string;
}

export function AnimatedCircleX({ className }: AnimatedCircleXProps) {
    return (
        <svg
            className={cn('animate-node-pop-in', className)}
            viewBox="0 0 16 16"
            fill="none"
        >
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
                x1="5.5" y1="5.5" x2="10.5" y2="10.5"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="8"
                style={{ '--path-length': '8' } as React.CSSProperties}
                className="animate-[node-draw-path_0.2s_ease-out_0.35s_both]"
            />
            <line
                x1="10.5" y1="5.5" x2="5.5" y2="10.5"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="8"
                style={{ '--path-length': '8' } as React.CSSProperties}
                className="animate-[node-draw-path_0.2s_ease-out_0.5s_both]"
            />
        </svg>
    );
}
