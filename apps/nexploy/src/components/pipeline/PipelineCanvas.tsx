'use client';

import { useRef, useState } from 'react';
import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    PanOnScrollMode,
    ReactFlow,
    type ReactFlowInstance,
    SelectionMode,
} from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { BaseNode } from '@/components/pipeline/nodes/BaseNode';
import { useDragAndDrop } from '@/components/pipeline/hooks/useDragAndDrop';
import { useMinimap } from '@/components/pipeline/hooks/useMinimap';
import { usePipelineContext } from '@/contexts/PipelineContext';

const nodeTypes = { 'pipeline-node': BaseNode };

export function PipelineCanvas() {
    const t = useTranslations('repository.pipeline');
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        handleNodeClick,
        handlePaneClick,
        handleSelectionChange,
    } = usePipelineContext();

    const { isDragOver, onDragOver, onDragLeave, onDrop } = useDragAndDrop(rfInstance);
    const { minimapVisible, onMoveStart, onMoveEnd } = useMinimap();

    return (
        <div
            ref={wrapperRef}
            className={cn(
                'relative flex-1 transition-all',
                isDragOver && 'ring-primary/40 ring-2 ring-inset',
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                // Pan: Space + left drag, trackpad two-finger scroll
                panActivationKeyCode="Space"
                panOnDrag
                panOnScroll
                panOnScrollMode={PanOnScrollMode.Free}
                zoomOnScroll={false}
                zoomOnPinch
                // Multi-select: drag without Space = selection box
                selectionMode={SelectionMode.Partial}
                multiSelectionKeyCode="Shift"
                selectionOnDrag
                onSelectionChange={handleSelectionChange}
                deleteKeyCode={['Delete', 'Backspace']}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                onMoveStart={onMoveStart}
                onMoveEnd={onMoveEnd}
                style={{ background: 'var(--background)' }}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1.5}
                    color="var(--base-6)"
                />
                <Controls
                    className="[&>button]:!border-border [&>button]:!bg-card [&>button]:!text-muted-foreground [&>button:hover]:!bg-muted border-border rounded-md border [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:last-child)]:border-r"
                    showInteractive
                    orientation={'horizontal'}
                />
                {/*<MiniMap*/}
                {/*    className={cn(*/}
                {/*        '!border-border !bg-card transition-all duration-300',*/}
                {/*        minimapVisible ? 'opacity-100' : 'pointer-events-none opacity-0',*/}
                {/*    )}*/}
                {/*    nodeColor="var(--accent)"*/}
                {/*    maskColor="oklch(from var(--accent) l c h / 0.5)"*/}
                {/*/>*/}
                <MiniMap
                    className={cn(
                        '!border-border !bg-card transition-all duration-300 [&>svg]:rounded-md [&>svg]:border',
                    )}
                    nodeColor={'var(--accent)'}
                    maskColor={'oklch(from var(--accent) l c h / 0.5)'}
                />

                {nodes.length === 0 && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="border-border bg-card flex size-16 items-center justify-center rounded-2xl border">
                            <svg
                                className="text-muted-foreground size-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
                                />
                            </svg>
                        </div>
                        <p className="text-muted-foreground text-sm">{t('empty')}</p>
                    </div>
                )}
            </ReactFlow>
        </div>
    );
}
