import { useCallback, useState } from 'react';
import { type Node, type ReactFlowInstance } from '@xyflow/react';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/lib/pipeline/nodeRegistry';
import { usePipelineContext } from '@/contexts/PipelineContext';

export function useDragAndDrop(rfInstance: ReactFlowInstance | null) {
    const [isDragOver, setIsDragOver] = useState(false);
    const { setNodes, triggerAutoSave } = usePipelineContext();

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

            const newNode: Node = {
                id: `${nodeType}-${Date.now()}`,
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
            triggerAutoSave();
        },
        [rfInstance, setNodes, triggerAutoSave],
    );

    return { isDragOver, onDragOver, onDragLeave, onDrop };
}
