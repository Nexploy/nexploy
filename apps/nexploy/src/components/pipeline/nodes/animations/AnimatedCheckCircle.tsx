'use client';

import { cn } from '@workspace/ui/lib/utils';

interface AnimatedCheckCircleProps {
    className?: string;
}

export function AnimatedCheckCircle({ className }: AnimatedCheckCircleProps) {
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
                stroke="#22c55e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="41"
                style={{ '--path-length': '41' } as React.CSSProperties}
                className="animate-[node-draw-path_0.45s_ease-out_both]"
            />
            <path
                d="M5 8.5L7 10.5L11.5 5.5"
                stroke="#22c55e"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="11"
                style={{ '--path-length': '11' } as React.CSSProperties}
                className="animate-[node-draw-path_0.3s_ease-out_0.35s_both]"
            />
        </svg>
    );
}
