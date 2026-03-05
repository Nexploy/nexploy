'use client';

import { useCallback, useRef, useState } from 'react';
import {
    addEdge,
    Background,
    type Connection,
    Controls,
    type Edge,
    MiniMap,
    type Node,
    ReactFlow,
    type ReactFlowInstance,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTranslations } from 'next-intl';
import { NodeType, PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/lib/pipeline/nodeRegistry';
import { BaseNode } from '@/components/pipeline/nodes/BaseNode';
import { NodePalette } from '@/components/pipeline/NodePalette';
import { NodeConfigPanel } from '@/components/pipeline/NodeConfigPanel';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { useAction } from 'next-safe-action/hooks';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { validatePipelineAction } from '@/actions/repository/pipeline/validatePipeline.action';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';

const nodeTypes = { 'pipeline-node': BaseNode };

function graphToFlow(graph: PipelineGraph): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = graph.nodes.map((n) => ({
        id: n.id,
        type: 'pipeline-node',
        position: n.position,
        data: {
            label: n.data.label ?? n.data.type,
            nodeType: n.data.type,
            definition: getNodeDefinition(n.data.type)!,
            config: n.data.config,
            pipelineNodeType: n.data.type,
        },
    }));

    const edges: Edge[] = graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
    }));

    return { nodes, edges };
}

function flowToGraph(nodes: Node[], edges: Edge[]): PipelineGraph {
    return {
        nodes: nodes.map((n) => ({
            id: n.id,
            type: n.data.pipelineNodeType as NodeType,
            position: n.position,
            data: {
                type: n.data.pipelineNodeType as NodeType,
                config: (n.data.config as Record<string, unknown>) ?? {},
                label: n.data.label as string,
            },
        })),
        edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            sourceHandle: e.sourceHandle ?? undefined,
            target: e.target,
            targetHandle: e.targetHandle ?? undefined,
        })),
    };
}

interface PipelineEditorInnerProps {
    repositoryId: string;
    initialGraph: PipelineGraph;
}

function PipelineEditorInner({ repositoryId, initialGraph }: PipelineEditorInnerProps) {
    const t = useTranslations('repository.pipeline');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const { nodes: initialNodes, edges: initialEdges } = graphToFlow(initialGraph);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const { execute: save, isPending: isSaving } = useAction(savePipelineAction);
    const { execute: validate, isPending: isValidating } = useAction(validatePipelineAction, {
        onSuccess: ({ data }) => {
            if (data?.valid) {
                toast.success(t('validationSuccess'));
            } else {
                toast.error(t('validationFailed'));
            }
        },
    });

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => setIsDragOver(false), []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            setIsDragOver(false);

            const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
            if (!nodeType || !rfInstance) return;

            const def = getNodeDefinition(nodeType);
            if (!def) return;

            const position = rfInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const id = `${nodeType}-${Date.now()}`;
            const newNode: Node = {
                id,
                type: 'pipeline-node',
                position,
                data: {
                    label: nodeType,
                    nodeType,
                    pipelineNodeType: nodeType,
                    definition: def,
                    config: { ...def.defaultConfig },
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [rfInstance, setNodes],
    );

    const selectedNode = selectedNodeId
        ? (nodes.find((n) => n.id === selectedNodeId) as Node | undefined)
        : null;

    const handleConfigChange = useCallback(
        (nodeId: string, config: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)),
            );
        },
        [setNodes],
    );

    const handleSave = () => {
        const graph = flowToGraph(nodes, edges);
        save({ repositoryId, graph });
    };

    const handleValidate = () => {
        const graph = flowToGraph(nodes, edges);
        validate({ graph });
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <PipelineToolbar
                onSave={handleSave}
                onValidate={handleValidate}
                isSaving={isSaving}
                isValidating={isValidating}
            />
            <div className="flex flex-1 overflow-hidden">
                <NodePalette />
                <div
                    ref={reactFlowWrapper}
                    className={cn('flex-1', isDragOver && 'ring-primary ring-2 ring-inset')}
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
                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                        onPaneClick={() => setSelectedNodeId(null)}
                        fitView
                        deleteKeyCode="Delete"
                    >
                        <Background />
                        <Controls />
                        <MiniMap />
                        {nodes.length === 0 && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <p className="text-muted-foreground text-sm">{t('empty')}</p>
                            </div>
                        )}
                    </ReactFlow>
                </div>
                {selectedNode && (
                    <NodeConfigPanel
                        node={{
                            id: selectedNode.id,
                            type: selectedNode.data.pipelineNodeType as NodeType,
                            position: selectedNode.position,
                            data: {
                                type: selectedNode.data.pipelineNodeType as NodeType,
                                config: (selectedNode.data.config as Record<string, unknown>) ?? {},
                                label: selectedNode.data.label as string,
                            },
                        }}
                        onChange={handleConfigChange}
                        onClose={() => setSelectedNodeId(null)}
                    />
                )}
            </div>
        </div>
    );
}

export function PipelineEditor(props: PipelineEditorInnerProps) {
    return (
        <ReactFlowProvider>
            <PipelineEditorInner {...props} />
        </ReactFlowProvider>
    );
}
