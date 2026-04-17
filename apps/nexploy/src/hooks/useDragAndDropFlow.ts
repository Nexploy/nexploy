import { useCallback, useState } from 'react';
import { Edge, Node, ReactFlowInstance } from '@xyflow/react';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { CONFIG_SCHEMAS } from '@/components/pipeline/nodes/nodeConfigPanel/nodeConfigRegistry';
import { usePipelineActions } from '@/contexts/PipelineContext';
import { getTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { getEdgeIdAtPosition } from '@/components/pipeline/utils/edgeUtils';

export function useDragAndDropFlow(rfInstance: ReactFlowInstance | null) {
    const [isDragOver, setIsDragOver] = useState(false);
    const { setNodes, setEdges, triggerAutoSave, handleNodeAdded } = usePipelineActions();
    const setDragOverEdgeId = usePipelineEditorStore((s) => s.setDragOverEdgeId);

    const onDragOver = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setIsDragOver(true);

            const edgeId = getEdgeIdAtPosition(event.clientX, event.clientY);
            setDragOverEdgeId(edgeId);
        },
        [setDragOverEdgeId],
    );

    const onDragLeave = useCallback(() => {
        setIsDragOver(false);
        setDragOverEdgeId(null);
    }, [setDragOverEdgeId]);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            setIsDragOver(false);
            setDragOverEdgeId(null);
            if (!rfInstance) return;

            const cursor = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const dropPosition = { x: cursor.x - 45, y: cursor.y - 45 };

            // Check if dropping on an edge
            const targetEdgeId = getEdgeIdAtPosition(event.clientX, event.clientY);

            const templateId = event.dataTransfer.getData('application/node-template');
            if (templateId) {
                const template = getTemplate(templateId);
                if (!template) return;

                const ts = Date.now();
                const newNodes: Node[] = template.nodes.map((tn, i) => {
                    const def = getNodeDefinition(tn.type as NodeId);
                    return {
                        id: `${tn.type}-${ts}-${i}`,
                        type: def?.type,
                        position: {
                            x: dropPosition.x + tn.offsetX,
                            y: dropPosition.y + tn.offsetY,
                        },
                        data: {
                            label: tn.type,
                            nodeType: tn.type,
                            definition: def,
                            config: {
                                ...(CONFIG_SCHEMAS[tn.type]?.partial().safeParse({}).data ?? {}),
                                ...(tn.config ?? {}),
                            },
                            isStartNode: def?.isStartNode ?? false,
                        },
                    };
                });

                const newEdges: Edge[] = template.edges.map((te) => ({
                    id: `e-${newNodes[te.sourceIndex]!.id}-${newNodes[te.targetIndex]!.id}`,
                    source: newNodes[te.sourceIndex]!.id,
                    target: newNodes[te.targetIndex]!.id,
                    sourceHandle: te.sourceHandle,
                    targetHandle: te.targetHandle,
                    type: 'gradient-edge',
                }));

                setNodes(() => newNodes);
                setEdges(() => newEdges);
                triggerAutoSave();
                return;
            }

            const nodeType = event.dataTransfer.getData('application/reactflow') as NodeId;
            if (!nodeType) return;

            const def = getNodeDefinition(nodeType);
            if (!def) return;

            const newNodeId = `${nodeType}-${Date.now()}`;
            const newNode: Node = {
                id: newNodeId,
                type: def.type,
                position: dropPosition,
                data: {
                    label: nodeType,
                    nodeType,
                    definition: def,
                    config: CONFIG_SCHEMAS[nodeType]?.partial().safeParse({}).data ?? {},
                    isStartNode: def.isStartNode ?? false,
                },
            };

            if (targetEdgeId) {
                // Insert node into edge: remove old edge, create two new edges
                const firstInput = def.handles.inputs[0];
                const firstOutput = def.handles.outputs[0];

                setEdges((edges) => {
                    const targetEdge = edges.find((e) => e.id === targetEdgeId);
                    if (!targetEdge || !firstInput || !firstOutput) {
                        return edges.concat({
                            id: `e-${newNodeId}-${Date.now()}`,
                            source: newNodeId,
                            target: newNodeId,
                            type: 'gradient-edge',
                        });
                    }

                    const withoutOld = edges.filter((e) => e.id !== targetEdgeId);
                    const edgeToNew: Edge = {
                        id: `e-${targetEdge.source}-${newNodeId}`,
                        source: targetEdge.source,
                        sourceHandle: targetEdge.sourceHandle,
                        target: newNodeId,
                        targetHandle: firstInput.id,
                        type: 'gradient-edge',
                    };
                    const edgeFromNew: Edge = {
                        id: `e-${newNodeId}-${targetEdge.target}`,
                        source: newNodeId,
                        sourceHandle: firstOutput.id,
                        target: targetEdge.target,
                        targetHandle: targetEdge.targetHandle,
                        type: 'gradient-edge',
                    };
                    return [...withoutOld, edgeToNew, edgeFromNew];
                });

                setNodes((nodes) => nodes.concat(newNode));
            } else {
                setNodes((nodes) => nodes.concat(newNode));
            }

            triggerAutoSave();
            handleNodeAdded(nodeType, newNodeId);
        },
        [rfInstance, setNodes, setEdges, triggerAutoSave, handleNodeAdded, setDragOverEdgeId],
    );

    return { isDragOver, onDragOver, onDragLeave, onDrop };
}
