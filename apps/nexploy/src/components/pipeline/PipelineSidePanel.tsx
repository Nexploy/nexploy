'use client';

import { useEffect, useRef } from 'react';
import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';
import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';

export function PipelineSidePanel() {
    const activePanel = usePipelinePanelStore((s) => s.activePanel);
    const isOpen = activePanel !== null;
    const lastPanelRef = useRef(activePanel ?? 'palette');

    useEffect(() => {
        if (activePanel) lastPanelRef.current = activePanel;
    }, [activePanel]);

    const renderedPanel = activePanel ?? lastPanelRef.current;

    return (
        <div
            data-open={isOpen}
            aria-hidden={!isOpen}
            className="relative shrink-0 overflow-hidden transition-[width] duration-200 ease-out data-[open=false]:pointer-events-none data-[open=false]:w-0 data-[open=true]:w-72"
        >
            <div
                data-open={isOpen}
                className="absolute inset-y-0 right-0 flex w-72 flex-col overflow-hidden border border-y-0 border-r-0 border-l bg-sidebar data-[open=true]:rounded-br-lg"
            >
                {renderedPanel === 'palette' ? <NodeAddPanel /> : null}
                {renderedPanel === 'template' ? <NodeTemplatePanel /> : null}
            </div>
        </div>
    );
}
