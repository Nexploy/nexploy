'use client';

import { Bot } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useAIPanelStore } from '@/stores/useAIPanelStore';

export function AIPanelToggle() {
    const isOpen = useAIPanelStore((s) => s.isOpen);
    const openPanel = useAIPanelStore((s) => s.openPanel);
    const closePanel = useAIPanelStore((s) => s.closePanel);

    return (
        <Button
            className={'size-8 rounded-l-none'}
            onClick={() => (isOpen ? closePanel() : openPanel())}
            title={isOpen ? 'Close AI panel' : 'Open AI panel'}
        >
            <Bot />
        </Button>
    );
}
