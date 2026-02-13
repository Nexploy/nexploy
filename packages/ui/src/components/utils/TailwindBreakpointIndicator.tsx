'use client';
import { useEffect, useState } from 'react';

const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

export default function TailwindBreakpointIndicator() {
    const [size, setSize] = useState('');

    const getBreakpoint = (width: number) => {
        if (width >= breakpoints['2xl']) return '2xl';
        if (width >= breakpoints.xl) return 'xl';
        if (width >= breakpoints.lg) return 'lg';
        if (width >= breakpoints.md) return 'md';
        if (width >= breakpoints.sm) return 'sm';
        return 'xs';
    };

    useEffect(() => {
        const handleResize = () => {
            setSize(getBreakpoint(window.innerWidth));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="fixed -bottom-1 -left-1 z-50 rounded-tr-2xl bg-black px-2 py-1 font-mono text-sm text-white dark:bg-white dark:text-black">
            {size}
        </div>
    );
}
