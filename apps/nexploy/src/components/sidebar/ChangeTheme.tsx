'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@workspace/ui/components/button';
import { motion } from 'motion/react';
import { cn } from '@workspace/ui/lib/utils';
import { useSidebar } from '@workspace/ui/components/sidebar';

const THEME = [
    {
        name: 'light',
        icon: Sun,
    },
    {
        name: 'dark',
        icon: Moon,
    },
    {
        name: 'system',
        icon: Monitor,
    },
];

export function ChangeTheme() {
    const { setTheme, theme } = useTheme();
    const { state, isMobile } = useSidebar();

    const isSidebarExpanded = state === 'expanded' || isMobile;

    return (
        <div
            className="flex items-center justify-between px-2 py-1 text-sm focus:bg-transparent"
            onSelect={(e) => e.preventDefault()}
        >
            {isSidebarExpanded && 'Theme'}
            <div className={cn('flex gap-1', !isSidebarExpanded && 'w-full justify-between')}>
                {THEME.map(({ name, icon: Icon }, index) => (
                    <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'relative size-6',
                            theme === name &&
                                'text-primary-foreground !bg-transparent hover:text-white',
                        )}
                        onClick={() => setTheme(name)}
                    >
                        <Icon className="z-20" />
                        {theme === name && (
                            <motion.div
                                layoutId="background-animation"
                                className="bg-primary hover:bg-primary/90 absolute bottom-0 left-0 size-6 w-full rounded-md"
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            />
                        )}
                    </Button>
                ))}
            </div>
        </div>
    );
}
