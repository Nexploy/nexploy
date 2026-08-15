import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { computeGraphLayout } from '@/components/pipeline/utils/graphLayout';
import { FIT_VIEW_OPTIONS } from '@/components/pipeline/utils/fitViewOptions';

export function useAutoLayout() {
    const { getNodes, getEdges, fitView } = useReactFlow();
    const { setNodes, triggerAutoSave } = usePipelineActions();

    return useCallback(() => {
        const positionMap = computeGraphLayout(getNodes(), getEdges());

        setNodes((nodes) =>
            nodes.map((node) => {
                const pos = positionMap.get(node.id);
                return pos ? { ...node, position: pos } : node;
            }),
        );

        triggerAutoSave();
        requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
    }, [getNodes, getEdges, setNodes, triggerAutoSave, fitView]);
}
