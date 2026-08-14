import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { usePipelineActions } from '@/stores/pipeline/usePipelineStore';
import { useFitViewOptions } from '@/components/pipeline/utils/fitView';
import { computeGraphLayout } from '@/components/pipeline/utils/graphLayout';

export function useAutoLayout() {
    const { getNodes, getEdges, fitView } = useReactFlow();
    const { setNodes, triggerAutoSave } = usePipelineActions();
    const fitViewOptions = useFitViewOptions();

    return useCallback(() => {
        const positionMap = computeGraphLayout(getNodes(), getEdges());

        setNodes((nodes) =>
            nodes.map((node) => {
                const pos = positionMap.get(node.id);
                return pos ? { ...node, position: pos } : node;
            }),
        );

        triggerAutoSave();
        requestAnimationFrame(() => fitView(fitViewOptions));
    }, [getNodes, getEdges, setNodes, triggerAutoSave, fitView, fitViewOptions]);
}
