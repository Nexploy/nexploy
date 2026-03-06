'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import {
    addEdge,
    type Connection,
    type Edge,
    type Node,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { graphToFlow } from '@/components/pipeline/utils/graphConvert';

interface PipelineContextValue {
    nodes: Node[];
    edges: Edge[];
    panelNodeId: string | null;
    selectedNodeIds: string[];
    onNodesChange: ReturnType<typeof useNodesState>[2];
    onEdgesChange: ReturnType<typeof useEdgesState>[2];
    onConnect: (connection: Connection) => void;
    handleSelectionChange: (selection: { nodes: Node[] }) => void;
    handleNodeDoubleClick: (_: React.MouseEvent, node: Node) => void;
    handlePaneClick: () => void;
    handleConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
    handleDeleteSelection: () => void;
    handleNodeDragStop: () => void;
    triggerAutoSave: () => void;
    saveVersion: number;
    setNodes: ReturnType<typeof useNodesState>[1];
}

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({
    initialGraph,
    children,
}: {
    initialGraph: PipelineGraph;
    children: ReactNode;
}) {
    const { nodes: initialNodes, edges: initialEdges } = graphToFlow(initialGraph);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialEdges);
    const [panelNodeId, setPanelNodeId] = useState<string | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [saveVersion, setSaveVersion] = useState(0);

    const onEdgesChange: typeof onEdgesChangeBase = useCallback(
        (changes) => {
            onEdgesChangeBase(changes);
            if (changes.some((c) => c.type === 'remove')) setSaveVersion((v) => v + 1);
        },
        [onEdgesChangeBase],
    );

    const triggerAutoSave = useCallback(() => setSaveVersion((v) => v + 1), []);
    const handleNodeDragStop = useCallback(() => setSaveVersion((v) => v + 1), []);

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

    const handleDeleteSelection = useCallback(() => {
        setNodes((nds) => nds.filter((n) => !selectedNodeIds.includes(n.id)));
        setEdges((eds) =>
            eds.filter(
                (e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target),
            ),
        );
        setSelectedNodeIds([]);
        setPanelNodeId(null);
    }, [selectedNodeIds, setNodes, setEdges]);

    return (
        <PipelineContext.Provider
            value={{
                nodes,
                edges,
                panelNodeId,
                selectedNodeIds,
                onNodesChange,
                onEdgesChange,
                onConnect,
                handleSelectionChange,
                handleNodeDoubleClick,
                handlePaneClick,
                handleConfigChange,
                handleDeleteSelection,
                handleNodeDragStop,
                triggerAutoSave,
                saveVersion,
                setNodes,
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
