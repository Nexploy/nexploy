import { useCallback, useState } from 'react';
import { Edge, Node, ReactFlowInstance } from '@xyflow/react';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { CONFIG_SCHEMAS } from '@/components/pipeline/nodes/nodeConfigPanel/nodeConfigRegistry';
import { usePipelineActions } from '@/contexts/PipelineContext';
import { getTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';

export function useDragAndDropFlow(rfInstance: ReactFlowInstance | null) {
    const [isDragOver, setIsDragOver] = useState(false);
    const { setNodes, setEdges, triggerAutoSave, handleNodeAdded } = usePipelineActions();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            setIsDragOver(false);
            if (!rfInstance) return;

            const cursor = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const dropPosition = { x: cursor.x - 45, y: cursor.y - 45 };

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

            setNodes((nodes) => nodes.concat(newNode));
            triggerAutoSave();
            handleNodeAdded(nodeType, newNodeId);
        },
        [rfInstance, setNodes, setEdges, triggerAutoSave, handleNodeAdded],
    );

    return { isDragOver, onDragOver, onDragLeave, onDrop };
}
