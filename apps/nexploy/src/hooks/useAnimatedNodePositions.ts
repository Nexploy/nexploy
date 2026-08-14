import { useEffect, useMemo, useRef, useState } from 'react';
import { type Node, type XYPosition } from '@xyflow/react';

export const NODE_TWEEN_MS = 350;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function serialize(nodes: Node[]): string {
    return nodes.map((node) => `${node.id}:${node.position.x}:${node.position.y}`).join('|');
}

export function useAnimatedNodePositions(nodes: Node[], enabled: boolean): Node[] {
    const targetKey = enabled ? serialize(nodes) : '';

    const [displayed, setDisplayed] = useState<Map<string, XYPosition>>(new Map());
    const displayedRef = useRef(displayed);
    displayedRef.current = displayed;

    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;

    useEffect(() => {
        if (!enabled) {
            if (displayedRef.current.size > 0) setDisplayed(new Map());
            return;
        }

        const targets = new Map(nodesRef.current.map((node) => [node.id, node.position]));
        const from = new Map<string, XYPosition>();
        let needsAnimation = false;

        for (const [id, target] of targets) {
            const current = displayedRef.current.get(id);
            from.set(id, current ?? target);
            if (current && (current.x !== target.x || current.y !== target.y)) needsAnimation = true;
        }

        if (!needsAnimation) {
            setDisplayed(targets);
            return;
        }

        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / NODE_TWEEN_MS);
            const eased = easeOutCubic(progress);
            const next = new Map<string, XYPosition>();

            for (const [id, target] of targets) {
                const origin = from.get(id) ?? target;
                next.set(id, {
                    x: origin.x + (target.x - origin.x) * eased,
                    y: origin.y + (target.y - origin.y) * eased,
                });
            }

            setDisplayed(next);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [targetKey, enabled]);

    return useMemo(() => {
        if (!enabled || displayed.size === 0) return nodes;
        return nodes.map((node) => {
            const position = displayed.get(node.id);
            if (!position || (position.x === node.position.x && position.y === node.position.y)) return node;
            return { ...node, position };
        });
    }, [nodes, enabled, displayed]);
}
