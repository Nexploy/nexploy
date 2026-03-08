'use client';

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    addEdge,
    type Connection,
    type Edge,
    type Node,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { flowToGraph, graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { usePipelineHistory } from '@/hooks/usePipelineHistory';
import { useAction } from 'next-safe-action/hooks';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { useParams } from 'next/navigation';
import { type getActiveBuilds } from '@/services/repository.service';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { type NodeRunStatus } from '@/types/pipeline.type';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

type ActiveBuild = Awaited<ReturnType<typeof getActiveBuilds>>[number];

interface PipelineContextValue {
    nodes: Node[];
    edges: Edge[];
    displayNodes: Node[];
    displayEdges: Edge[];
    isViewingBuild: boolean;
    panelNodeId: string | null;
    selectedNodeIds: string[];
    isSaving: boolean;
    activeBuilds: ActiveBuild[];
    activeBuildId: string | undefined;
    setActiveBuildId: (id: string | undefined) => void;
    onNodesChange: ReturnType<typeof useNodesState>[2];
    onEdgesChange: ReturnType<typeof useEdgesState>[2];
    onConnect: (connection: Connection) => void;
    handleSelectionChange: (selection: { nodes: Node[] }) => void;
    handleNodeDoubleClick: (_: React.MouseEvent, node: Node) => void;
    handlePaneClick: () => void;
    handleConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
    handleDeleteSelection: () => void;
    handleDuplicateSelection: () => void;
    triggerAutoSave: () => void;
    undo: () => void;
    redo: () => void;
    setNodes: ReturnType<typeof useNodesState>[1];
    setEdges: ReturnType<typeof useEdgesState>[1];
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({
    initialGraph,
    activeBuilds = [],
    children,
}: {
    initialGraph: PipelineGraph;
    activeBuilds?: ActiveBuild[];
    children: ReactNode;
}) {
    const { nodes: initialNodes, edges: initialEdges } = graphToFlow(initialGraph);
    const { repositoryId } = useParams<{ repositoryId: string }>();

    const isUndoRedoRef = useRef(false);
    const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialEdges);
    const [panelNodeId, setPanelNodeId] = useState<string | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [activeBuildId, setActiveBuildId] = useState<string | undefined>();
    const [saveVersion, setSaveVersion] = useState(0);

    const { execute: savePipeline, isPending: isSaving } = useAction(savePipelineAction);

    const committedVersionRef = useRef(0);

    const onRestore = useCallback(
        (snapshot: { nodes: Node[]; edges: Edge[] }) => {
            isUndoRedoRef.current = true;
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
            setSaveVersion((v) => v + 1);
        },
        [setNodes, setEdges],
    );

    const { commit, undo, redo } = usePipelineHistory(onRestore, {
        nodes: initialNodes,
        edges: initialEdges,
    });

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

    const onNodesChange: typeof onNodesChangeBase = useCallback(
        (changes) => {
            onNodesChangeBase(changes);
            if (changes.some((c) => c.type === 'remove')) setSaveVersion((v) => v + 1);
        },
        [onNodesChangeBase],
    );

    const onEdgesChange: typeof onEdgesChangeBase = useCallback(
        (changes) => {
            onEdgesChangeBase(changes);
            if (changes.some((c) => c.type === 'remove')) setSaveVersion((v) => v + 1);
        },
        [onEdgesChangeBase],
    );

    const triggerAutoSave = useCallback(() => setSaveVersion((v) => v + 1), []);

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

    const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
        setPanelNodeId((prev) => (prev === node.id ? null : node.id));
    }, []);

    const handlePaneClick = useCallback(() => {
        setPanelNodeId(null);
        setSelectedNodeIds([]);
    }, []);

    const handleConfigChange = useCallback(
        (nodeId: string, config: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)),
            );
        },
        [setNodes],
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

    const activeBuild = useMemo(
        () => activeBuilds.find((b) => b.id === activeBuildId),
        [activeBuilds, activeBuildId],
    );
    const isViewingBuild = !!activeBuild?.pipelineSnapshot;
    const isLiveBuild = isViewingBuild && !TERMINAL_STATUSES.has(activeBuild!.status);

    // Fetch fresh nodeStatuses from DB each time a build is selected
    const [fetchedNodeStatuses, setFetchedNodeStatuses] = useState<Record<string, NodeRunStatus>>(
        {},
    );
    useEffect(() => {
        if (!activeBuildId || !repositoryId) {
            setFetchedNodeStatuses({});
            return;
        }
        fetch(`/api/repositories/${repositoryId}/builds/${activeBuildId}`)
            .then((r) => r.json())
            .then((data: { nodeStatuses: Record<string, NodeRunStatus> }) => {
                setFetchedNodeStatuses(data.nodeStatuses ?? {});
            })
            .catch(() => {});
    }, [activeBuildId, repositoryId]);

    const [liveStatuses, setLiveStatuses] = useState<Record<string, NodeRunStatus>>({});
    useEffect(() => {
        setLiveStatuses({});
    }, [activeBuildId]);

    const refreshToken = useCallback(async () => {
        if (!activeBuildId) return null;
        const result = await onGetTokenBuildIdAction({
            buildId: activeBuildId,
            topics: ['node-status'],
        });
        return result?.data ?? null;
    }, [activeBuildId]);

    const { data: liveEvents } = useInngestSubscription({ enabled: isLiveBuild, refreshToken });

    useEffect(() => {
        for (const evt of liveEvents) {
            if (evt.topic === 'node-status' && evt.data?.nodeId) {
                setLiveStatuses((prev) => ({
                    ...prev,
                    [evt.data.nodeId as string]: evt.data.status as NodeRunStatus,
                }));
            }
        }
    }, [liveEvents]);

    const { displayNodes, displayEdges } = useMemo(() => {
        if (!activeBuild?.pipelineSnapshot) {
            return { displayNodes: nodes, displayEdges: edges };
        }
        const snapshot = activeBuild.pipelineSnapshot as unknown as PipelineGraph;
        const { nodes: snapshotNodes, edges: snapshotEdges } = graphToFlow(snapshot);
        return {
            displayNodes: snapshotNodes.map((n) => ({
                ...n,
                data: {
                    ...n.data,
                    runStatus: liveStatuses[n.id] ?? fetchedNodeStatuses[n.id] ?? undefined,
                    viewOnly: true,
                },
            })),
            displayEdges: snapshotEdges,
        };
    }, [activeBuild, liveStatuses, fetchedNodeStatuses, nodes, edges]);

    const handleDeleteSelection = useCallback(() => {
        const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
        if (selectedIds.size === 0) return;
        setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
        setEdges((eds) =>
            eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)),
        );
        setSelectedNodeIds([]);
        setPanelNodeId(null);
        setSaveVersion((v) => v + 1);
    }, [nodes, setNodes, setEdges]);

    return (
        <PipelineContext.Provider
            value={{
                nodes,
                edges,
                displayNodes,
                displayEdges,
                isViewingBuild,
                panelNodeId,
                selectedNodeIds,
                isSaving,
                activeBuilds,
                activeBuildId,
                setActiveBuildId,
                onNodesChange,
                onEdgesChange,
                onConnect,
                handleSelectionChange,
                handleNodeDoubleClick,
                handlePaneClick,
                handleConfigChange,
                handleDeleteSelection,
                handleDuplicateSelection,
                triggerAutoSave,
                undo,
                redo,
                setNodes,
                setEdges,
            }}
        >
            {children}
        </PipelineContext.Provider>
    );
}

export function usePipelineContext() {
    const ctx = useContext(PipelineContext);
    if (!ctx) throw new Error('usePipelineContext must be used within PipelineProvider');
    return ctx;
}
