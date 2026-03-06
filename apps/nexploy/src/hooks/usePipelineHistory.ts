import { useCallback, useRef, useState } from 'react';
import { type Edge, type Node } from '@xyflow/react';

type Snapshot = { nodes: Node[]; edges: Edge[] };

export function usePipelineHistory(
    onRestore: (snapshot: Snapshot) => void,
    initial: Snapshot,
) {
    const historyRef = useRef<Snapshot[]>([initial]);
    const pointerRef = useRef(0);
    // State only used to expose canUndo/canRedo reactively
    const [pointer, setPointer] = useState(0);

    const commit = useCallback((snapshot: Snapshot) => {
        historyRef.current = historyRef.current.slice(0, pointerRef.current + 1);
        historyRef.current.push(snapshot);
        pointerRef.current = historyRef.current.length - 1;
        setPointer(pointerRef.current);
    }, []);

    const undo = useCallback(() => {
        if (pointerRef.current <= 0) return;
        pointerRef.current--;
        const snapshot = historyRef.current[pointerRef.current];
        if (!snapshot) return;
        setPointer(pointerRef.current);
        onRestore(snapshot);
    }, [onRestore]);

    const redo = useCallback(() => {
        if (pointerRef.current >= historyRef.current.length - 1) return;
        pointerRef.current++;
        const snapshot = historyRef.current[pointerRef.current];
        if (!snapshot) return;
        setPointer(pointerRef.current);
        onRestore(snapshot);
    }, [onRestore]);

    return {
        commit,
        undo,
        redo,
        canUndo: pointer > 0,
        canRedo: pointer < historyRef.current.length - 1,
    };
}
