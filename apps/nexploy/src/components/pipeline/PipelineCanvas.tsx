'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    Background,
    BackgroundVariant,
    MiniMap,
    type Node,
    type NodeMouseHandler,
    Panel,
    PanOnScrollMode,
    ReactFlow,
    type ReactFlowInstance,
    SelectionMode,
    useReactFlow,
    useStore,
} from '@xyflow/react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { BaseNode } from '@/components/pipeline/nodes/BaseNode';
import { GradientEdge } from '@/components/pipeline/edges/GradientEdge';
import { useDragAndDropFlow } from '@/hooks/useDragAndDropFlow';
import { useMinimap } from '@/hooks/useMinimap';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { ButtonPanel } from '@/components/pipeline/nodes/ButtonPanel';
import { useHotkeys } from '@/lib/useHotKeys';
import { NodeContextMenu, type NodeContextMenuState } from '@/components/pipeline/NodeContextMenu';

const nodeTypes = { 'pipeline-node': BaseNode };
const edgeTypes = { 'gradient-edge': GradientEdge };

export function PipelineCanvas() {
    const t = useTranslations('repository.pipeline');
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow();
    const addSelectedNodes = useStore((s) => s.addSelectedNodes);
    const [isSpaceHeld, setIsSpaceHeld] = useState(false);
    const [contextMenu, setContextMenu] = useState<NodeContextMenuState | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        handleNodeDoubleClick,
        handleNodeDragStop,
        handlePaneClick,
        handleSelectionChange,
        undo,
        redo,
        triggerAutoSave,
        setNodes,
    } = usePipelineContext();

    const openContextMenu = useCallback((event: React.MouseEvent, nodeId: string) => {
        event.preventDefault();
        setContextMenu({ clientX: event.clientX, clientY: event.clientY, nodeId });
    }, []);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const onNodeContextMenu = useCallback<NodeMouseHandler>(
        (event, node) => openContextMenu(event, node.id),
        [openContextMenu],
    );

    const onSelectionContextMenu = useCallback(
        (event: React.MouseEvent, nodes: Node[]) => {
            const first = nodes[0];
            if (first) openContextMenu(event, first.id);
        },
        [openContextMenu],
    );

    useHotkeys(
        ['meta+a', 'ctrl+a'],
        () => {
            addSelectedNodes(getNodes().map((n) => n.id));
        },
        { preventDefault: true },
    );

    useHotkeys(
        'd',
        () => {
            const selected = getNodes().filter((n) => n.selected);
            if (selected.length === 0) return;
            const allDisabled = selected.every((n) => n.data.disabled);
            const selectedIds = new Set(selected.map((n) => n.id));
            setNodes((nds) =>
                nds.map((n) =>
                    selectedIds.has(n.id)
                        ? { ...n, data: { ...n.data, disabled: !allDisabled } }
                        : n,
                ),
            );
            triggerAutoSave();
        },
        { preventDefault: true },
    );

    useHotkeys('space', () => setIsSpaceHeld(true), {
        keydown: true,
        keyup: false,
        preventDefault: true,
    });
    useHotkeys('space', () => setIsSpaceHeld(false), { keydown: false, keyup: true });
    useHotkeys('meta+z', () => undo(), { preventDefault: true, capture: true });
    useHotkeys('meta+shift+z', () => redo(), { preventDefault: true, capture: true });
    useHotkeys('ctrl+z', () => undo(), { preventDefault: true, capture: true });
    useHotkeys('ctrl+shift+z', () => redo(), { preventDefault: true, capture: true });

    const { isDragOver, onDragOver, onDragLeave, onDrop } = useDragAndDropFlow(rfInstance);
    const { minimapVisible, onMoveStart, onMoveEnd } = useMinimap();

    return (
        <div
            ref={wrapperRef}
            data-panning={isSpaceHeld}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
                'relative flex-1 transition-all',
                isDragOver && 'ring-primary/40 ring-2 ring-inset',
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <ButtonPanel />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeDragStop={handleNodeDragStop}
                onPaneClick={handlePaneClick}
                onNodeContextMenu={onNodeContextMenu}
                onSelectionContextMenu={onSelectionContextMenu}
                panActivationKeyCode={['Space', 'Meta']}
                panOnDrag={nodes.length > 0 ? [1, 2] : false}
                panOnScroll={nodes.length > 0}
                panOnScrollMode={PanOnScrollMode.Free}
                zoomOnScroll={false}
                zoomOnPinch={nodes.length > 0}
                zoomOnDoubleClick={false}
                selectionMode={SelectionMode.Partial}
                multiSelectionKeyCode="Shift"
                selectionOnDrag
                onSelectionChange={handleSelectionChange}
                deleteKeyCode={['Delete', 'Backspace']}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
                {nodes.length > 0 && (
                    <Panel position="bottom-left">
                        <div className="flex gap-1.5">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="size-8"
                                onClick={() => zoomOut()}
                                title="Zoom out"
                            >
                                <Minus />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="size-8"
                                onClick={() => fitView({ padding: 0.3 })}
                                title="Fit view"
                            >
                                <Maximize />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="size-8"
                                onClick={() => zoomIn()}
                                title="Zoom in"
                            >
                                <Plus />
                            </Button>
                        </div>
                    </Panel>
                )}
                <MiniMap
                    className={cn(
                        '!border-border !bg-card transition-all duration-300 [&>svg]:rounded-md [&>svg]:border',
                        minimapVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
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
            {contextMenu && <NodeContextMenu menu={contextMenu} onClose={closeContextMenu} />}
        </div>
    );
}
