'use client';

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import useSWR from 'swr';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { fetcherApi } from '@/lib/api/fetcherApi';
import {
    addEdge,
    type Connection,
    type Edge,
    type Node,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import { type NodeId, type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { flowToGraph, graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { usePipelineHistory } from '@/hooks/usePipelineHistory';
import { getNodeLifecycle } from '@/components/pipeline/nodeManifestRegistry';
import { useAction } from 'next-safe-action/hooks';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { useParams } from 'next/navigation';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { Build } from 'generated/client';

interface PipelineActionsContextValue {
    setNodes: ReturnType<typeof useNodesState>[1];
    setEdges: ReturnType<typeof useEdgesState>[1];
    onEdgesChange: ReturnType<typeof useEdgesState>[2];
    onConnect: (connection: Connection) => void;
    handleSelectionChange: (selection: { nodes: Node[] }) => void;
    openDialogSettingNode: (id: string) => void;
    handleResetPanelNode: () => void;
    handleConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
    handleNodeAdded: (nodeType: NodeId, nodeId: string) => void;
    triggerAutoSave: () => void;
    undo: () => void;
    redo: () => void;
}

interface PipelineStateContextValue {
    nodes: Node[];
    edges: Edge[];
    displayNodes: Node[];
    displayEdges: Edge[];
    isViewingBuild: boolean;
    isSaving: boolean;
    activeBuild?: Build;
    builds: Build[];
    nodeStatuses: Record<string, NodeRunStatus>;
    canUndo: boolean;
    canRedo: boolean;
    onNodesChange: ReturnType<typeof useNodesState>[2];
    handleDuplicateSelection: () => void;
    handleDeleteSelection: () => void;
}

interface PipelineContextValue extends PipelineActionsContextValue, PipelineStateContextValue {}

const PipelineActionsContext = createContext<PipelineActionsContextValue | null>(null);
const PipelineStateContext = createContext<PipelineStateContextValue | null>(null);

export function PipelineProvider({
    initialGraph,
    builds = [],
    children,
}: {
    initialGraph: PipelineGraph;
    builds?: Build[];
    children: ReactNode;
}) {
    const { repositoryId } = useParams<{ repositoryId: string }>();
    const { nodes: initialNodes, edges: initialEdges } = graphToFlow(initialGraph);

    const isUndoRedoRef = useRef(false);
    const committedVersionRef = useRef(0);

    const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialEdges);

    const setPanelNodeId = usePipelineEditorStore((s) => s.setPanelNodeId);
    const setSelectedNodeIds = usePipelineEditorStore((s) => s.setSelectedNodeIds);
    const saveVersion = usePipelineEditorStore((s) => s.saveVersion);
    const setSaveVersion = usePipelineEditorStore((s) => s.setSaveVersion);
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);
    const nodeStatuses = usePipelineEditorStore((s) => s.nodeStatuses);
    const setNodeStatuses = usePipelineEditorStore((s) => s.setNodeStatuses);

    const { execute: savePipeline, isPending: isSaving } = useAction(savePipelineAction);

    const onRestore = useCallback(
        (snapshot: { nodes: Node[]; edges: Edge[] }) => {
            isUndoRedoRef.current = true;
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
            setSaveVersion((v) => v + 1);
        },
        [setNodes, setEdges, setSaveVersion],
    );

    const { commit, undo, redo, canUndo, canRedo } = usePipelineHistory(onRestore, {
        nodes: initialNodes,
        edges: initialEdges,
    });

    useSWR<{ nodeStatuses: Record<string, NodeRunStatus> }>(
        activeBuildId ? { url: `/api/repositories/${repositoryId}/builds/${activeBuildId}` } : null,
        fetcherApi,
        {
            onSuccess: (buildData) => setNodeStatuses(buildData?.nodeStatuses),
        },
    );

    const activeBuild = builds.find((b) => b.id === activeBuildId);
    const isViewingBuild = !!activeBuild?.pipelineSnapshot;

    const snapshotFlow = useMemo(() => {
        if (!isViewingBuild) return null;
        return graphToFlow(activeBuild.pipelineSnapshot as unknown as PipelineGraph);
    }, [activeBuild]);

    const { displayNodes, displayEdges } = useMemo(() => {
        if (!snapshotFlow) return { displayNodes: nodes, displayEdges: edges };
        return {
            displayNodes: snapshotFlow.nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    status: nodeStatuses[node.id] ?? undefined,
                    viewOnly: true,
                },
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

    const triggerAutoSave = useCallback(() => setSaveVersion((v) => v + 1), []);

    const handleNodeAdded = useCallback(
        (nodeType: NodeId) => {
            const lifecycle = getNodeLifecycle(nodeType);
            if (!lifecycle?.onAdd) return;
            lifecycle.onAdd(repositoryId);
        },
        [repositoryId, setNodes],
    );

    const onEdgesChange: typeof onEdgesChangeBase = useCallback(
        (changes) => {
            onEdgesChangeBase(changes);
            if (changes.some((c) => c.type === 'remove')) setSaveVersion((v) => v + 1);
        },
        [onEdgesChangeBase],
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((eds) => addEdge({ ...connection, type: 'gradient-edge' }, eds));
            setSaveVersion((v) => v + 1);
        },
        [setEdges],
    );

    const handleSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
        const ids = sel.map((n) => n.id);
        setSelectedNodeIds((prev) => {
            const same = prev.length === ids.length && prev.every((id, i) => id === ids[i]);
            return same ? prev : ids;
        });
        if (ids.length === 0) setPanelNodeId(null);
    }, []);

    const openDialogSettingNode = useCallback((id: string) => {
        setPanelNodeId((prev) => (prev === id ? null : id));
    }, []);

    const handleResetPanelNode = useCallback(() => {
        setSelectedNodeIds([]);
        setPanelNodeId(null);
    }, []);

    const handleConfigChange = useCallback(
        (nodeId: string, config: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)),
            );
        },
        [setNodes],
    );

    const fireRemoveLifecycle = useCallback(
        (removedNodes: Node[]) => {
            const remaining = nodes.filter((n) => !removedNodes.some((r) => r.id === n.id));
            const seen = new Set<string>();
            for (const removed of removedNodes) {
                const nodeType = removed.data.nodeType as NodeId;
                if (seen.has(nodeType)) continue;
                seen.add(nodeType);
                const lifecycle = getNodeLifecycle(nodeType);
                if (lifecycle?.onRemove) {
                    const remainingCount = remaining.filter(
                        (n) => n.data.nodeType === nodeType,
                    ).length;
                    lifecycle.onRemove(repositoryId, remainingCount);
                }
            }
        },
        [nodes, repositoryId],
    );

    const onNodesChange: typeof onNodesChangeBase = useCallback(
        (changes) => {
            const removeChanges = changes.filter((c) => c.type === 'remove');
            if (removeChanges.length > 0) {
                const removedIds = new Set(removeChanges.map((c) => c.id));
                const removedNodes = nodes.filter((n) => removedIds.has(n.id));
                fireRemoveLifecycle(removedNodes);
                setSaveVersion((v) => v + 1);
            }
            onNodesChangeBase(changes);
        },
        [onNodesChangeBase, nodes, fireRemoveLifecycle],
    );

    const handleDuplicateSelection = useCallback(() => {
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
        setNodes([...nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), ...copies]);
        setEdges((eds) => {
            const edgeCopies = eds
                .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
                .map((e) => ({
                    ...e,
                    id: `${e.id}${suffix}`,
                    source: `${e.source}${suffix}`,
                    target: `${e.target}${suffix}`,
                }));
            return [...eds, ...edgeCopies];
        });
        setSelectedNodeIds(copies.map((c) => c.id));
        setSaveVersion((v) => v + 1);
    }, [nodes, setNodes, setEdges]);

    const handleDeleteSelection = useCallback(() => {
        const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
        if (selectedIds.size === 0) return;
        const deletedNodes = nodes.filter((n) => selectedIds.has(n.id));
        fireRemoveLifecycle(deletedNodes);
        setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
        setEdges((eds) =>
            eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)),
        );
        setSelectedNodeIds([]);
        setPanelNodeId(null);
        setSaveVersion((v) => v + 1);
    }, [nodes, setNodes, setEdges, fireRemoveLifecycle]);

    useEffect(() => {
        if (saveVersion === 0 || saveVersion === committedVersionRef.current) return;
        committedVersionRef.current = saveVersion;
        if (isUndoRedoRef.current) {
            isUndoRedoRef.current = false;
        } else {
            commit({ nodes: [...nodes], edges: [...edges] });
        }
        savePipeline({ repositoryId, graph: flowToGraph(nodes, edges) });
    }, [saveVersion, nodes, edges]);

    useEffect(() => {
        return () => {
            setActiveBuildId(null);
        };
    }, []);

    const actionsValue = useMemo<PipelineActionsContextValue>(
        () => ({
            setNodes,
            setEdges,
            onEdgesChange,
            onConnect,
            handleSelectionChange,
            openDialogSettingNode,
            handleResetPanelNode,
            handleConfigChange,
            handleNodeAdded,
            triggerAutoSave,
            undo,
            redo,
        }),
        [
            setNodes,
            setEdges,
            onEdgesChange,
            onConnect,
            handleSelectionChange,
            openDialogSettingNode,
            handleResetPanelNode,
            handleConfigChange,
            handleNodeAdded,
            triggerAutoSave,
            undo,
            redo,
        ],
    );

    const stateValue = useMemo<PipelineStateContextValue>(
        () => ({
            nodes,
            edges,
            displayNodes,
            displayEdges,
            isViewingBuild,
            isSaving,
            builds,
            activeBuild,
            nodeStatuses,
            canUndo,
            canRedo,
            onNodesChange,
            handleDuplicateSelection,
            handleDeleteSelection,
        }),
        [
            nodes,
            edges,
            displayNodes,
            displayEdges,
            isViewingBuild,
            isSaving,
            builds,
            activeBuild,
            nodeStatuses,
            canUndo,
            canRedo,
            onNodesChange,
            handleDuplicateSelection,
            handleDeleteSelection,
        ],
    );

    return (
        <PipelineActionsContext.Provider value={actionsValue}>
            <PipelineStateContext.Provider value={stateValue}>
                {children}
            </PipelineStateContext.Provider>
        </PipelineActionsContext.Provider>
    );
}

export function usePipelineActions(): PipelineActionsContextValue {
    const ctx = useContext(PipelineActionsContext);
    if (!ctx) throw new Error('usePipelineActions must be used within PipelineProvider');
    return ctx;
}

export function usePipelineState(): PipelineStateContextValue {
    const ctx = useContext(PipelineStateContext);
    if (!ctx) throw new Error('usePipelineState must be used within PipelineProvider');
    return ctx;
}

export function usePipelineContext(): PipelineContextValue {
    const actions = usePipelineActions();
    const state = usePipelineState();
    return useMemo(() => ({ ...actions, ...state }), [actions, state]);
}
