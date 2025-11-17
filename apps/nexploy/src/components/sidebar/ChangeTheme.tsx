'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@workspace/ui/components/button';

export function ChangeTheme() {
    const { setTheme, theme } = useTheme();

    return (
        <div
            className="flex items-center justify-between px-2 py-1 text-sm focus:bg-transparent focus:text-red-300"
            onSelect={(e) => e.preventDefault()}
        >
            Theme
            <div className="flex gap-1">
                <Button
                    variant={theme === 'light' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setTheme('light')}
                >
                    <Sun />
                </Button>
                <Button
                    variant={theme === 'dark' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setTheme('dark')}
                >
                    <Moon />
                </Button>
                <Button
                    variant={theme === 'system' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setTheme('system')}
                >
                    <Monitor className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
