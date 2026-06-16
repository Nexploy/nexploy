'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup, } from '@workspace/ui/components/resizable';
import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { NodeConfigDialog } from '@/components/pipeline/nodes/nodeConfigPanel/NodeConfigDialog';
import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';

export function PipelineEditor() {
    const { activePanel } = usePipelinePanelStore();

    return (
        <div className="flex h-full flex-col">
            <PipelineToolbar />
            <div className="relative mx-5 mb-5 flex flex-1 overflow-hidden rounded-lg rounded-t-none border">
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel id="pipeline-canvas" className="flex">
                        <PipelineCanvas />
                    </ResizablePanel>
                    {activePanel && (
                        <>
                            <ResizableHandle />
                            <ResizablePanel
                                id="pipeline-side-panel"
                                defaultSize={250}
                                minSize={250}
                                maxSize={500}
                            >
                                {activePanel === 'palette' ? (
                                    <NodeAddPanel />
                                ) : (
                                    <NodeTemplatePanel />
                                )}
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>
            <NodeConfigDialog />
        </div>
    );
}
