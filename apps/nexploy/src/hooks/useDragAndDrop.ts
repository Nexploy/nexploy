import { useCallback, useState } from 'react';
import { type Edge, type Node, type ReactFlowInstance } from '@xyflow/react';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { getTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';

export function useDragAndDrop(rfInstance: ReactFlowInstance | null) {
    const [isDragOver, setIsDragOver] = useState(false);
    const { setNodes, setEdges, triggerAutoSave } = usePipelineContext();

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
            if (!rfInstance) return;

            const dropPosition = rfInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const templateId = event.dataTransfer.getData('application/pipeline-template');
            if (templateId) {
                const template = getTemplate(templateId);
                if (!template) return;

                const ts = Date.now();
                const newNodes: Node[] = template.nodes.map((tn, i) => {
                    const def = getNodeDefinition(tn.type as NodeType);
                    return {
                        id: `${tn.type}-${ts}-${i}`,
                        type: 'pipeline-node',
                        position: {
                            x: dropPosition.x + tn.offsetX,
                            y: dropPosition.y + tn.offsetY,
                        },
                        data: {
                            label: tn.type,
                            nodeType: tn.type,
                            pipelineNodeType: tn.type,
                            definition: def,
                            config: { ...(def?.defaultConfig ?? {}), ...(tn.config ?? {}) },
                        },
                    };
                });

                const newEdges: Edge[] = template.edges.map((te) => ({
                    id: `e-${newNodes[te.sourceIndex]!.id}-${newNodes[te.targetIndex]!.id}`,
                    source: newNodes[te.sourceIndex]!.id,
                    target: newNodes[te.targetIndex]!.id,
                    type: 'gradient-edge',
                }));

                setNodes((nds) => nds.concat(newNodes));
                setEdges((eds) => eds.concat(newEdges));
                triggerAutoSave();
                return;
            }

            const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
            if (!nodeType) return;

            const def = getNodeDefinition(nodeType);
            if (!def) return;

            const newNode: Node = {
                id: `${nodeType}-${Date.now()}`,
                type: 'pipeline-node',
                position: dropPosition,
                data: {
                    label: nodeType,
                    nodeType,
                    pipelineNodeType: nodeType,
                    definition: def,
                    config: { ...def.defaultConfig },
                },
            };

            setNodes((nds) => nds.concat(newNode));
            triggerAutoSave();
        },
        [rfInstance, setNodes, setEdges, triggerAutoSave],
    );

    return { isDragOver, onDragOver, onDragLeave, onDrop };
}
