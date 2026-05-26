'use client';

import { cn } from '@workspace/ui/lib/utils';

interface AnimatedAlertCircleProps {
    className?: string;
}

export function AnimatedAlertCircle({ className }: AnimatedAlertCircleProps) {
    return (
        <svg className={cn('animate-node-pop-in', className)} viewBox="0 0 16 16" fill="none">
            <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="#eab308"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="41"
                style={{ '--path-length': '41' } as React.CSSProperties}
                className="animate-[node-draw-path_0.4s_ease-out_both]"
            />
            <line
                x1="8"
                y1="5.5"
                x2="8"
                y2="9"
                stroke="#eab308"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4"
                style={{ '--path-length': '4' } as React.CSSProperties}
                className="animate-[node-draw-path_0.2s_ease-out_0.35s_both]"
            />
            <circle
                cx="8"
                cy="11"
                r="0.75"
                fill="#eab308"
                className="animate-node-fade-in"
                style={{ animationDelay: '0.5s' } as React.CSSProperties}
            />
        </svg>
    );
}
