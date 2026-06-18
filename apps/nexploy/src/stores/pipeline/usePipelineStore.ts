'use client';

import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
    type NodeRunStatus,
    type PipelineGraph,
} from '@workspace/typescript-interface/pipeline/node';
import { graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { usePipelineStoreInstance } from '@/contexts/PipelineContext';
import type { PipelineActionsContextValue } from '@workspace/typescript-interface/stores/pipelineStore';

export type { PipelineStore } from './createPipelineStore';
export { createPipelineStore } from './createPipelineStore';
export { PipelineContext } from '@/contexts/PipelineContext';
export type {
    PipelineActionsContextValue,
    PipelineStateContextValue,
    PipelineStoreValue,
    PipelineBuild,
} from '@workspace/typescript-interface/stores/pipelineStore';

const EMPTY_NODE_STATUSES: Record<string, NodeRunStatus> = {};

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
            patchBuildOverlay: s.patchBuildOverlay,
            setBuildNodeStatuses: s.setBuildNodeStatuses,
        })),
    );
}

export function usePipelineGraph() {
    const store = usePipelineStoreInstance();
    return useStore(
        store,
        useShallow((s) => ({ nodes: s.nodes, edges: s.edges })),
    );
}

export function usePipelineStageId(): string {
    const store = usePipelineStoreInstance();
    return useStore(store, (s) => s.stageId);
}

export function useIsViewingBuild(): boolean {
    const store = usePipelineStoreInstance();
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);
    return useStore(
        store,
        (s) => !!(activeBuildId && s.builds.find((b) => b.id === activeBuildId)?.pipelineSnapshot),
    );
}

export function usePipelineSaveState() {
    const store = usePipelineStoreInstance();
    return useStore(
        store,
        useShallow((s) => ({
            isSaving: s.isSaving,
            canUndo: s.canUndo,
            canRedo: s.canRedo,
        })),
    );
}

export function usePipelineBuilds() {
    const store = usePipelineStoreInstance();
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);

    const builds = useStore(store, (s) => s.builds);
    const overlays = useStore(store, (s) => s.buildOverlays);
    const pagination = useStore(
        store,
        useShallow((s) => ({
            hasMoreBuilds: s.hasMoreBuilds,
            isLoadingMoreBuilds: s.isLoadingMoreBuilds,
            loadMoreBuilds: s.loadMoreBuilds,
        })),
    );

    const merged = useMemo(
        () => builds.map((b) => (overlays[b.id] ? { ...b, ...overlays[b.id] } : b)),
        [builds, overlays],
    );
    const activeBuild = useMemo(
        () => merged.find((b) => b.id === activeBuildId),
        [merged, activeBuildId],
    );

    return { builds: merged, activeBuild, ...pagination };
}

export function usePipelineDisplay() {
    const store = usePipelineStoreInstance();
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);

    const { nodes, edges } = useStore(
        store,
        useShallow((s) => ({ nodes: s.nodes, edges: s.edges })),
    );

    const snapshot = useStore(store, (s) =>
        activeBuildId
            ? (s.builds.find((b) => b.id === activeBuildId)?.pipelineSnapshot ?? null)
            : null,
    );

    const nodeStatuses = useStore(store, (s) =>
        activeBuildId
            ? (s.buildNodeStatuses[activeBuildId] ?? EMPTY_NODE_STATUSES)
            : EMPTY_NODE_STATUSES,
    );

    const isViewingBuild = !!snapshot;

    const snapshotFlow = useMemo(
        () => (snapshot ? graphToFlow(snapshot as unknown as PipelineGraph) : null),
        [snapshot],
    );

    const { displayNodes, displayEdges } = useMemo(() => {
        if (!snapshotFlow) return { displayNodes: nodes, displayEdges: edges };
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
    }, [snapshotFlow, nodeStatuses, nodes, edges]);

    return { nodes, displayNodes, displayEdges, isViewingBuild, nodeStatuses };
}
