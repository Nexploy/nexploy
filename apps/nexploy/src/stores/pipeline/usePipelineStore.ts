'use client';

import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { usePipelineStoreInstance } from '@/contexts/PipelineContext';
import type {
    PipelineActionsContextValue,
    PipelineStateContextValue,
    PipelineStoreValue,
} from '@workspace/typescript-interface/stores/pipelineStore';

export type { PipelineStore } from './createPipelineStore';
export { createPipelineStore } from './createPipelineStore';
export { PipelineContext } from '@/contexts/PipelineContext';
export type {
    PipelineActionsContextValue,
    PipelineStateContextValue,
    PipelineStoreValue,
    PipelineBuild,
} from '@workspace/typescript-interface/stores/pipelineStore';

export function usePipelineStore(): PipelineStoreValue {
    const store = usePipelineStoreInstance();
    const state = useStore(store);

    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);
    const nodeStatuses = usePipelineEditorStore((s) => s.nodeStatuses);

    const activeBuild = useMemo(
        () => state.builds.find((b) => b.id === activeBuildId),
        [state.builds, activeBuildId],
    );
    const isViewingBuild = !!activeBuild?.pipelineSnapshot;

    const snapshotFlow = useMemo(() => {
        if (!isViewingBuild) return null;
        return graphToFlow(activeBuild.pipelineSnapshot as unknown as PipelineGraph);
    }, [activeBuild]);

    const { displayNodes, displayEdges } = useMemo(() => {
        if (!snapshotFlow) return { displayNodes: state.nodes, displayEdges: state.edges };
        return {
            displayNodes: snapshotFlow.nodes.map((node) => ({
                ...node,
                data: { ...node.data, status: nodeStatuses[node.id] ?? undefined, viewOnly: true },
            })),
            displayEdges: snapshotFlow.edges.map((edge) => ({
                ...edge,
                animated:
                    nodeStatuses[edge.source] === 'running' ||
                    (nodeStatuses[edge.source] === 'completed' &&
                        nodeStatuses[edge.target] === 'running'),
            })),
        };
    }, [snapshotFlow, nodeStatuses, state.nodes, state.edges]);

    return {
        ...state,
        displayNodes,
        displayEdges,
        isViewingBuild,
        activeBuild,
        nodeStatuses,
    };
}

export function usePipelineActions(): PipelineActionsContextValue {
    const store = usePipelineStoreInstance();
    return useStore(
        store,
        useShallow((s) => ({
            setNodes: s.setNodes,
            setEdges: s.setEdges,
            onNodesChange: s.onNodesChange,
            onEdgesChange: s.onEdgesChange,
            onConnect: s.onConnect,
            handleSelectionChange: s.handleSelectionChange,
            openDialogSettingNode: s.openDialogSettingNode,
            handleResetPanelNode: s.handleResetPanelNode,
            handleConfigChange: s.handleConfigChange,
            handleNodeAdded: s.handleNodeAdded,
            triggerAutoSave: s.triggerAutoSave,
            undo: s.undo,
            redo: s.redo,
            handleDuplicateSelection: s.handleDuplicateSelection,
            handleDeleteSelection: s.handleDeleteSelection,
        })),
    );
}

export function usePipelineState(): PipelineStateContextValue {
    return usePipelineStore();
}
