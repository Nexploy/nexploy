'use client';

import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';
import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';

export function PipelineSidePanel() {
    const activePanel = usePipelinePanelStore((s) => s.activePanel);
    const isOpen = activePanel !== null;

    return (
        <div
            data-open={isOpen}
            aria-hidden={!isOpen}
            className="pointer-events-none absolute inset-y-2 right-2 z-10 flex w-72 max-w-[calc(100%-1rem)] transition-[opacity,transform] duration-200 ease-out data-[open=true]:pointer-events-auto data-[open=false]:translate-x-[calc(100%+0.5rem)] data-[open=true]:translate-x-0 data-[open=false]:opacity-0 data-[open=true]:opacity-100"
        >
            <div className="bg-sidebar/85 border-border/70 flex h-full w-full flex-col overflow-hidden rounded-lg border backdrop-blur-md">
                {activePanel === 'palette' ? <NodeAddPanel /> : <NodeTemplatePanel />}
            </div>
        </div>
    );
}
