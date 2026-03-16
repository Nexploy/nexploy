'use client';

import { useCallback, useRef, useState } from 'react';
import {
    Background,
    BackgroundVariant,
    IsValidConnection,
    MiniMap,
    Node,
    NodeMouseHandler,
    Panel,
    PanOnScrollMode,
    ReactFlow,
    ReactFlowInstance,
    SelectionMode,
    useReactFlow,
    useStore,
} from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { Maximize, Minus, Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { GradientEdge } from '@/components/pipeline/edges/GradientEdge';
import { useDragAndDropFlow } from '@/hooks/useDragAndDropFlow';
import { useMinimap } from '@/hooks/useMinimap';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { ButtonPanel } from '@/components/pipeline/nodes/ButtonPanel';
import { useHotkeys } from '@/lib/useHotKeys';
import { NodeContextMenu, type NodeContextMenuState } from '@/components/pipeline/NodeContextMenu';
import { BuildsPanel } from '@/components/pipeline/buildsPanel/BuildsPanel';
import { LargeNode } from '@/components/pipeline/nodes/types/LargeNode';
import { BaseNode } from '@/components/pipeline/nodes/types/BaseNode';
import { AttachNode } from '@/components/pipeline/nodes/types/AttachNode';

const nodeTypes = { 'base-node': BaseNode, 'large-node': LargeNode, 'attach-node': AttachNode };
const edgeTypes = { 'gradient-edge': GradientEdge };

export function PipelineCanvas() {
    const t = useTranslations('repository.pipeline');
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow();

    const addSelectedNodes = useStore((s) => s.addSelectedNodes);
    const [isSpaceHeld, setIsSpaceHeld] = useState(false);
    const [contextMenu, setContextMenu] = useState<NodeContextMenuState | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const setHoveredEdgeId = usePipelineEditorStore((s) => s.setHoveredEdgeId);

    const isValidConnection = useCallback<IsValidConnection>(
        (connection) => {
            const nodes = getNodes();
            const sourceNode = nodes.find((n) => n.id === connection.source);
            const targetNode = nodes.find((n) => n.id === connection.target);
            if (!sourceNode || !targetNode) return false;

            const sourceDef = sourceNode.data.definition as NodeDefinition | undefined;

            if (connection.sourceHandle) {
                const attachment = sourceDef?.handles?.attachments?.find(
                    (a) => a.id === connection.sourceHandle,
                );
                if (attachment) {
                    return attachment.id === (targetNode.data.nodeType as string);
                }
            }

            const targetDef = targetNode.data.definition as NodeDefinition | undefined;
            const targetHandle = targetDef?.handles.inputs.find(
                (h) => h.id === connection.targetHandle,
            );
            if (targetHandle?.acceptsFrom) {
                return connection.sourceHandle === targetHandle.acceptsFrom;
            }

            return true;
        },
        [getNodes],
    );

    const {
        nodes,
        displayNodes,
        displayEdges,
        isViewingBuild,
        onNodesChange,
        onEdgesChange,
        onConnect,
        openDialogSettingNode,
        handlePaneClick,
        handleSelectionChange,
        handleDuplicateSelection,
        handleDeleteSelection,
        undo,
        redo,
        triggerAutoSave,
        setNodes,
    } = usePipelineContext();

    const openContextMenu = useCallback((event: React.MouseEvent, nodeId: string) => {
        event.preventDefault();
        setContextMenu({ clientX: event.clientX, clientY: event.clientY, nodeId });
    }, []);

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
        { preventDefault: true, ref: wrapperRef },
    );

    useHotkeys(
        'd',
        () => {
            const selected = getNodes().filter((node) => node.selected);
            if (selected.length === 0) return;
            const allDisabled = selected.every((node) => node.data.disabled);
            const selectedIds = new Set(selected.map((node) => node.id));
            setNodes((nodes) =>
                nodes.map((node) =>
                    selectedIds.has(node.id)
                        ? { ...node, data: { ...node.data, disabled: !allDisabled } }
                        : node,
                ),
            );
            triggerAutoSave();
        },
        { preventDefault: true, ref: wrapperRef },
    );

    useHotkeys('space', () => setIsSpaceHeld(true), {
        keydown: true,
        keyup: false,
        preventDefault: true,
        ref: wrapperRef,
    });
    useHotkeys('space', () => setIsSpaceHeld(false), {
        keydown: false,
        keyup: true,
        ref: wrapperRef,
    });
    useHotkeys(['meta+d', 'ctrl+d'], () => handleDuplicateSelection(), {
        preventDefault: true,
        ref: wrapperRef,
    });
    useHotkeys(['delete', 'backspace'], () => handleDeleteSelection(), {
        preventDefault: true,
        ref: wrapperRef,
    });
    useHotkeys('meta+z', () => undo(), { preventDefault: true, capture: true, ref: wrapperRef });
    useHotkeys('meta+shift+z', () => redo(), {
        preventDefault: true,
        capture: true,
        ref: wrapperRef,
    });
    useHotkeys('ctrl+z', () => undo(), { preventDefault: true, capture: true, ref: wrapperRef });
    useHotkeys('ctrl+shift+z', () => redo(), {
        preventDefault: true,
        capture: true,
        ref: wrapperRef,
    });

    const { isDragOver, onDragOver, onDragLeave, onDrop } = useDragAndDropFlow(rfInstance);
    const { minimapVisible, onMoveStart, onMoveEnd } = useMinimap();

    return (
        <div
            ref={wrapperRef}
            tabIndex={-1}
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
            <BuildsPanel />
            <ButtonPanel />
            <ReactFlow
                nodes={displayNodes}
                edges={displayEdges}
                onNodesChange={isViewingBuild ? () => {} : onNodesChange}
                onEdgesChange={isViewingBuild ? () => {} : onEdgesChange}
                onEdgeMouseEnter={
                    isViewingBuild ? undefined : (_, edge) => setHoveredEdgeId(edge.id)
                }
                onEdgeMouseLeave={isViewingBuild ? undefined : () => setHoveredEdgeId(null)}
                onConnect={isViewingBuild ? undefined : onConnect}
                isValidConnection={isViewingBuild ? undefined : isValidConnection}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodeDoubleClick={
                    isViewingBuild ? undefined : (_, node) => openDialogSettingNode(node.id)
                }
                onNodeDragStop={isViewingBuild ? undefined : triggerAutoSave}
                onPaneClick={handlePaneClick}
                onNodeContextMenu={isViewingBuild ? undefined : onNodeContextMenu}
                onSelectionContextMenu={isViewingBuild ? undefined : onSelectionContextMenu}
                nodesDraggable={!isViewingBuild}
                nodesConnectable={!isViewingBuild}
                elementsSelectable={!isViewingBuild}
                panOnDrag={nodes.length > 0 ? [1, 2] : false}
                panOnScroll={nodes.length > 0}
                panOnScrollMode={PanOnScrollMode.Free}
                zoomOnScroll={false}
                zoomOnPinch={nodes.length > 0}
                zoomOnDoubleClick={false}
                selectionMode={SelectionMode.Partial}
                selectionOnDrag={!isViewingBuild}
                onSelectionChange={isViewingBuild ? undefined : handleSelectionChange}
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                onMoveStart={onMoveStart}
                onMoveEnd={onMoveEnd}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1.5}
                    color="var(--base-6)"
                />
                {displayNodes.length > 0 && (
                    <Panel className={'!m-2'} position="bottom-left">
                        <div className="flex gap-1.5">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="size-8"
                                onClick={() => zoomOut()}
                                title={t('canvas.zoomOut')}
                            >
                                <Minus />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="size-8"
                                onClick={() => fitView({ padding: 0.3 })}
                                title={t('canvas.fitView')}
                            >
                                <Maximize />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="size-8"
                                onClick={() => zoomIn()}
                                title={t('canvas.zoomIn')}
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
                {displayNodes.length === 0 && (
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
            {contextMenu && (
                <NodeContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
            )}
        </div>
    );
}
