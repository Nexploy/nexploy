import { useCallback, useRef } from 'react';
import { Edge, Node, useReactFlow } from '@xyflow/react';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { usePipelineActions } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { getEdgeIdAtPosition } from '@/components/pipeline/utils/edgeUtils';

interface DragSession {
    canInsert: boolean;
    firstInputId: string;
    firstOutputId: string;
}

export function useNodeDragInsert() {
    const { setEdges, triggerAutoSave } = usePipelineActions();
    const { getEdges } = useReactFlow();
    const setDragOverEdgeId = usePipelineEditorStore((s) => s.setDragOverEdgeId);

    const sessionRef = useRef<DragSession | null>(null);

    const onNodeDragStart = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            const edges = getEdges();
            const isUnconnected = !edges.some((e) => e.source === node.id || e.target === node.id);

            if (!isUnconnected) {
                sessionRef.current = null;
                return;
            }

            const def = node.data.definition as NodeDefinition | undefined;
            const firstInput = def?.handles.inputs[0];
            const firstOutput = def?.handles.outputs[0];

            if (!firstInput || !firstOutput) {
                sessionRef.current = null;
                return;
            }

            sessionRef.current = {
                canInsert: true,
                firstInputId: firstInput.id,
                firstOutputId: firstOutput.id,
            };
        },
        [getEdges],
    );

    const onNodeDrag = useCallback(
        (event: React.MouseEvent) => {
            if (!sessionRef.current?.canInsert) return;
            const edgeId = getEdgeIdAtPosition(event.clientX, event.clientY);
            setDragOverEdgeId(edgeId);
        },
        [setDragOverEdgeId],
    );

    const onNodeDragStop = useCallback(
        (event: React.MouseEvent, node: Node) => {
            setDragOverEdgeId(null);

            const session = sessionRef.current;
            sessionRef.current = null;

            if (!session?.canInsert) {
                triggerAutoSave();
                return;
            }

            const targetEdgeId = getEdgeIdAtPosition(event.clientX, event.clientY);

            if (!targetEdgeId) {
                triggerAutoSave();
                return;
            }

            setEdges((edges) => {
                const targetEdge = edges.find((e) => e.id === targetEdgeId);
                if (!targetEdge) return edges;

                const withoutOld = edges.filter((e) => e.id !== targetEdgeId);
                const edgeToNew: Edge = {
                    id: `e-${targetEdge.source}-${node.id}`,
                    source: targetEdge.source,
                    sourceHandle: targetEdge.sourceHandle,
                    target: node.id,
                    targetHandle: session.firstInputId,
                    type: 'gradient-edge',
                };
                const edgeFromNew: Edge = {
                    id: `e-${node.id}-${targetEdge.target}`,
                    source: node.id,
                    sourceHandle: session.firstOutputId,
                    target: targetEdge.target,
                    targetHandle: targetEdge.targetHandle,
                    type: 'gradient-edge',
                };
                return [...withoutOld, edgeToNew, edgeFromNew];
            });

            triggerAutoSave();
        },
        [setEdges, triggerAutoSave, setDragOverEdgeId],
    );

    return { onNodeDragStart, onNodeDrag, onNodeDragStop };
}
