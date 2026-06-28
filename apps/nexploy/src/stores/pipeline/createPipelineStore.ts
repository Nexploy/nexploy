'use client';

import { createStore } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { type NodeId, type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { flowToGraph, graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { getNodeLifecycle } from '@/components/pipeline/nodeManifestRegistry';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import type { PipelineBuild, PipelineStoreState, Snapshot } from '@workspace/typescript-interface/stores/pipelineStore';

export type PipelineStore = ReturnType<typeof createPipelineStore>;

export function createPipelineStore({
    repositoryId,
    stageId,
    initialGraph,
    initialBuilds,
    initialHasMore,
}: {
    repositoryId: string;
    stageId: string;
    initialGraph: PipelineGraph;
    initialBuilds: PipelineBuild[];
    initialHasMore: boolean;
}) {
    const { nodes: initialNodes, edges: initialEdges } = graphToFlow(initialGraph);

    let historyStack: Snapshot[] = [{ nodes: initialNodes, edges: initialEdges }];
    let historyPointer = 0;
    let isUndoRedo = false;

    return createStore<PipelineStoreState>((set, get) => ({
        nodes: initialNodes,
        edges: initialEdges,
        builds: initialBuilds,
        hasMoreBuilds: initialHasMore,
        isLoadingMoreBuilds: false,
        loadMoreBuilds: () => {},
        isSaving: false,
        canUndo: false,
        canRedo: false,
        repositoryId,
        stageId,
        buildOverlays: {},
        buildNodeStatuses: {},
        buildNodeDurations: {},
        buildNodeStartTimes: {},

        setNodes: (updater) =>
            set((s) => ({ nodes: typeof updater === 'function' ? updater(s.nodes) : updater })),

        setEdges: (updater) =>
            set((s) => ({ edges: typeof updater === 'function' ? updater(s.edges) : updater })),

        onNodesChange: (changes) => {
            set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }));
            if (changes.some((c) => c.type === 'remove')) get().triggerAutoSave();
        },

        onEdgesChange: (changes) => {
            set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }));
            if (changes.some((c) => c.type === 'remove')) get().triggerAutoSave();
        },

        onConnect: (connection) => {
            set((s) => ({ edges: addEdge({ ...connection, type: 'gradient-edge' }, s.edges) }));
            get().triggerAutoSave();
        },

        handleSelectionChange: ({ nodes: sel }) => {
            const ids = sel.map((n) => n.id);
            const editor = usePipelineEditorStore.getState();
            editor.setSelectedNodeIds((prev) => {
                const same = prev.length === ids.length && prev.every((id, i) => id === ids[i]);
                return same ? prev : ids;
            });
            if (ids.length === 0) editor.setPanelNodeId(null);
        },

        openDialogSettingNode: (id) => {
            usePipelineEditorStore.getState().setPanelNodeId((prev) => (prev === id ? null : id));
        },

        handleResetPanelNode: () => {
            const editor = usePipelineEditorStore.getState();
            editor.setSelectedNodeIds([]);
            editor.setPanelNodeId(null);
        },

        handleConfigChange: (nodeId, config) => {
            set((s) => ({
                nodes: s.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
                ),
            }));
        },

        handleNodeAdded: (nodeType: NodeId, _nodeId?) => {
            const lifecycle = getNodeLifecycle(nodeType);
            if (!lifecycle?.onAdd) return;
            lifecycle.onAdd(get().repositoryId);
        },

        triggerAutoSave: () => {
            const { nodes, edges } = get();
            if (!isUndoRedo) {
                get()._commit({ nodes: [...nodes], edges: [...edges] });
            }
            isUndoRedo = false;
            get()._save();
        },

        handleDuplicateSelection: () => {
            const { nodes, edges } = get();
            const selected = nodes.filter((n) => n.selected);
            if (selected.length === 0) return;
            const suffix = `-copy-${Date.now()}`;
            const selectedIds = new Set(selected.map((n) => n.id));
            const copies = selected.map((n) => ({
                ...n,
                id: `${n.id}${suffix}`,
                position: { x: n.position.x + 40, y: n.position.y + 40 },
                selected: true,
                data: { ...n.data },
            }));
            const newNodes = [
                ...nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
                ...copies,
            ];
            const newEdges = [
                ...edges,
                ...edges
                    .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
                    .map((e) => ({
                        ...e,
                        id: `${e.id}${suffix}`,
                        source: `${e.source}${suffix}`,
                        target: `${e.target}${suffix}`,
                    })),
            ];
            set({ nodes: newNodes, edges: newEdges });
            usePipelineEditorStore.getState().setSelectedNodeIds(copies.map((c) => c.id));
            get().triggerAutoSave();
        },

        handleDeleteSelection: () => {
            const { nodes, edges } = get();
            const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
            if (selectedIds.size === 0) return;

            const remaining = nodes.filter((n) => !selectedIds.has(n.id));
            const seen = new Set<string>();
            const repoId = get().repositoryId;
            for (const removed of nodes.filter((n) => selectedIds.has(n.id))) {
                const nodeType = removed.data.nodeType as NodeId;
                if (seen.has(nodeType)) continue;
                seen.add(nodeType);
                const lifecycle = getNodeLifecycle(nodeType);
                if (lifecycle?.onRemove) {
                    const count = remaining.filter((n) => n.data.nodeType === nodeType).length;
                    lifecycle.onRemove(repoId, count);
                }
            }

            const editor = usePipelineEditorStore.getState();
            set({
                nodes: nodes.filter((n) => !selectedIds.has(n.id)),
                edges: edges.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)),
            });
            editor.setSelectedNodeIds([]);
            editor.setPanelNodeId(null);
            get().triggerAutoSave();
        },

        patchBuildOverlay: (buildId, partial) =>
            set((s) => ({
                buildOverlays: {
                    ...s.buildOverlays,
                    [buildId]: { ...s.buildOverlays[buildId], ...partial },
                },
            })),

        setBuildNodeStatuses: (buildId, updater) =>
            set((s) => {
                const prev = s.buildNodeStatuses[buildId] ?? {};
                const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
                return { buildNodeStatuses: { ...s.buildNodeStatuses, [buildId]: next } };
            }),

        setBuildNodeDurations: (buildId, updater) =>
            set((s) => {
                const prev = s.buildNodeDurations[buildId] ?? {};
                const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
                return { buildNodeDurations: { ...s.buildNodeDurations, [buildId]: next } };
            }),

        setBuildNodeStartTimes: (buildId, updater) =>
            set((s) => {
                const prev = s.buildNodeStartTimes[buildId] ?? {};
                const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
                return { buildNodeStartTimes: { ...s.buildNodeStartTimes, [buildId]: next } };
            }),

        _commit: (snapshot) => {
            historyStack = historyStack.slice(0, historyPointer + 1);
            historyStack.push(snapshot);
            historyPointer = historyStack.length - 1;
            set({ canUndo: historyPointer > 0, canRedo: false });
        },

        undo: () => {
            if (historyPointer <= 0) return;
            historyPointer--;
            const snapshot = historyStack[historyPointer];
            if (!snapshot) return;
            isUndoRedo = true;
            set({
                nodes: snapshot.nodes,
                edges: snapshot.edges,
                canUndo: historyPointer > 0,
                canRedo: historyPointer < historyStack.length - 1,
            });
            get()._save();
        },

        redo: () => {
            if (historyPointer >= historyStack.length - 1) return;
            historyPointer++;
            const snapshot = historyStack[historyPointer];
            if (!snapshot) return;
            isUndoRedo = true;
            set({
                nodes: snapshot.nodes,
                edges: snapshot.edges,
                canUndo: historyPointer > 0,
                canRedo: historyPointer < historyStack.length - 1,
            });
            get()._save();
        },

        _save: async () => {
            const { repositoryId: repoId, stageId: stage, nodes, edges, isSaving } = get();
            if (isSaving) return;
            set({ isSaving: true });
            try {
                await savePipelineAction({
                    repositoryId: repoId,
                    stageId: stage,
                    graph: flowToGraph(nodes, edges),
                });
            } finally {
                set({ isSaving: false });
            }
        },
    }));
}
