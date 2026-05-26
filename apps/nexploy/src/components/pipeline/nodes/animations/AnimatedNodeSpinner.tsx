'use client';

import { cn } from '@workspace/ui/lib/utils';

interface AnimatedNodeSpinnerProps {
    categoryHex: string;
    className?: string;
}

export function AnimatedNodeSpinner({ categoryHex, className }: AnimatedNodeSpinnerProps) {
    return (
        <svg
            className={cn('animate-node-spinner', className)}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
        >
            <circle
                cx="8"
                cy="8"
                r="6"
                stroke={categoryHex}
                strokeOpacity="0.2"
                strokeWidth="2"
            />
            <path
                d="M8 2 A6 6 0 0 1 14 8"
                stroke={categoryHex}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
