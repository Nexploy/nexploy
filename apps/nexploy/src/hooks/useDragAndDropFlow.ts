import { useCallback, useState } from 'react';
import { Node, ReactFlowInstance } from '@xyflow/react';
import { NodeId } from '@nexploy/nodes/core/node';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { getConfigDefaults } from '@/components/pipeline/nodeManifestRegistry';
import { usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { getTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';
import { useApplyPipelineTemplate } from '@/hooks/useApplyPipelineTemplate';

export function useDragAndDropFlow(rfInstance: ReactFlowInstance | null) {
    const [isDragOver, setIsDragOver] = useState(false);
    const { setNodes, triggerAutoSave, handleNodeAdded } = usePipelineActions();
    const applyTemplate = useApplyPipelineTemplate();

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
                applyTemplate(template, dropPosition);
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
                    config: getConfigDefaults(nodeType),
                    isStartNode: def.isStartNode ?? false,
                    isEndNode: def.isEndNode ?? false,
                },
            };

            setNodes((nodes) => nodes.concat(newNode));
            triggerAutoSave();
            handleNodeAdded(nodeType, newNodeId);
        },
        [rfInstance, setNodes, triggerAutoSave, handleNodeAdded, applyTemplate],
    );

    return { isDragOver, onDragOver, onDragLeave, onDrop };
}
