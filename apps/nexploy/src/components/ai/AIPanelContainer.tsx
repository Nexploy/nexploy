'use client';

import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { InsetPanel } from '@/components/layout/InsetPanel';
import { PanelAI } from '@/components/ai/PanelAI';
import { cn } from '@workspace/ui/lib/utils';

export function AIPanelContainer() {
    const isOpen = useAIPanelStore((s) => s.isOpen);

    return (
        <div
            className={cn(
                'ml-2 shrink-0 overflow-hidden rounded-none shadow-none transition-[width,margin] duration-300 ease-in-out md:rounded-xl md:shadow-sm',
                isOpen ? 'w-80' : 'ml-0 w-0',
            )}
        >
            <InsetPanel className="h-full w-80">
                <PanelAI />
            </InsetPanel>
        </div>
    );
}
