'use client';

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type Edge,
    type EdgeChange,
    type Node,
    type NodeChange,
} from '@xyflow/react';
import { type PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { EDGE_STYLE, graphToFlow } from '@/components/pipeline/utils/graphConvert';

interface PipelineContextValue {
    nodes: Node[];
    edges: Edge[];
    selectedNodeId: string | null;
    selectedNodeIds: string[];
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    handleSelectionChange: (selection: { nodes: Node[] }) => void;
    handleNodeClick: (_: React.MouseEvent, node: Node) => void;
    handlePaneClick: () => void;
    handleConfigChange: (nodeId: string, config: Record<string, unknown>) => void;
    handleDeleteSelection: () => void;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
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

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

    const selectedNodeIdsRef = useRef(selectedNodeIds);
    selectedNodeIdsRef.current = selectedNodeIds;

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [],
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );

    const onConnect = useCallback(
        (connection: Connection) =>
            setEdges((eds) =>
                addEdge({ ...connection, type: 'smoothstep', style: EDGE_STYLE }, eds),
            ),
        [],
    );

    const handleSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
        const ids = sel.map((n) => n.id);
        setSelectedNodeIds((prev) => {
            const same = prev.length === ids.length && prev.every((id, i) => id === ids[i]);
            return same ? prev : ids;
        });
        if (ids.length === 1) {
            setSelectedNodeId((prev) => (prev === ids[0] ? prev : (ids[0] ?? null)));
        } else if (ids.length === 0) {
            setSelectedNodeId(null);
        }
    }, []);

    const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const handlePaneClick = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
    }, []);

    const handleConfigChange = useCallback((nodeId: string, config: Record<string, unknown>) => {
        setNodes((nds) =>
            nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)),
        );
    }, []);

    const handleDeleteSelection = useCallback(() => {
        const ids = selectedNodeIdsRef.current;
        setNodes((nds) => nds.filter((n) => !ids.includes(n.id)));
        setEdges((eds) => eds.filter((e) => !ids.includes(e.source) && !ids.includes(e.target)));
        setSelectedNodeIds([]);
        setSelectedNodeId(null);
    }, []);

    return (
        <PipelineContext.Provider
            value={{
                nodes,
                edges,
                selectedNodeId,
                selectedNodeIds,
                onNodesChange,
                onEdgesChange,
                onConnect,
                handleSelectionChange,
                handleNodeClick,
                handlePaneClick,
                handleConfigChange,
                handleDeleteSelection,
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
