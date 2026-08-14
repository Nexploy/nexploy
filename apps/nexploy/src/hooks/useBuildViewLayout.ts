import { useEffect, useMemo, useState } from 'react';
import { type Edge, type Node, type XYPosition } from '@xyflow/react';

type MeasuredEntry = [id: string, width: number, height: number];
type Size = { width: number; height: number };

const H_MARGIN = 80;
const V_MARGIN = 60;
const LABEL_BELOW = 30;
const MAX_PASSES = 24;

function effectiveSize(node: Node, size: Size): Size {
    const hasLabelBelow = node.type === 'base-node' || node.type === 'attach-node';
    return { width: size.width, height: size.height + (hasLabelBelow ? LABEL_BELOW : 0) };
}

function separate(
    ids: string[],
    positions: Map<string, XYPosition>,
    authored: Map<string, XYPosition>,
    sizes: Map<string, Size>,
    isSatellite: (id: string) => boolean,
): void {
    for (let pass = 0; pass < MAX_PASSES; pass++) {
        let moved = false;

        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const first = ids[i]!;
                const second = ids[j]!;
                const firstPosition = positions.get(first)!;
                const secondPosition = positions.get(second)!;
                const firstSize = sizes.get(first)!;
                const secondSize = sizes.get(second)!;

                const penetrationX =
                    Math.min(firstPosition.x + firstSize.width, secondPosition.x + secondSize.width) +
                    H_MARGIN -
                    Math.max(firstPosition.x, secondPosition.x);
                const penetrationY =
                    Math.min(firstPosition.y + firstSize.height, secondPosition.y + secondSize.height) +
                    V_MARGIN -
                    Math.max(firstPosition.y, secondPosition.y);

                if (penetrationX <= 0 || penetrationY <= 0) continue;

                const firstAuthored = authored.get(first)!;
                const secondAuthored = authored.get(second)!;
                const authoredGapX = Math.abs(
                    firstAuthored.x + firstSize.width / 2 - (secondAuthored.x + secondSize.width / 2),
                );
                const authoredGapY = Math.abs(
                    firstAuthored.y + firstSize.height / 2 - (secondAuthored.y + secondSize.height / 2),
                );
                const separateOnX =
                    authoredGapX === authoredGapY ? penetrationX < penetrationY : authoredGapX > authoredGapY;

                const authoredCenter = (id: string) => {
                    const position = authored.get(id)!;
                    const size = sizes.get(id)!;
                    return separateOnX ? position.x + size.width / 2 : position.y + size.height / 2;
                };

                const bothSatellites = isSatellite(first) === isSatellite(second);
                const mover = bothSatellites
                    ? authoredCenter(second) >= authoredCenter(first)
                        ? second
                        : first
                    : isSatellite(first)
                      ? first
                      : second;
                const anchor = mover === first ? second : first;

                const moverPosition = positions.get(mover)!;
                const sign = authoredCenter(mover) >= authoredCenter(anchor) ? 1 : -1;

                positions.set(
                    mover,
                    separateOnX
                        ? { x: moverPosition.x + sign * penetrationX, y: moverPosition.y }
                        : { x: moverPosition.x, y: moverPosition.y + sign * penetrationY },
                );

                moved = true;
            }
        }

        if (!moved) return;
    }
}

function readRenderedSizes(): string {
    const entries: MeasuredEntry[] = [];
    for (const element of document.querySelectorAll<HTMLElement>('.react-flow__node')) {
        const id = element.getAttribute('data-id');
        if (id) entries.push([id, element.offsetWidth, element.offsetHeight]);
    }
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return JSON.stringify(entries);
}

function useRenderedNodeSizes(enabled: boolean): string {
    const [sizes, setSizes] = useState('');

    useEffect(() => {
        if (!enabled) {
            setSizes('');
            return;
        }

        let observed: Element[] = [];

        const sync = () =>
            setSizes((previous) => {
                const next = readRenderedSizes();
                return previous === next ? previous : next;
            });

        const resizeObserver = new ResizeObserver(sync);

        const attach = () => {
            const nodeElements = [...document.querySelectorAll('.react-flow__node')];
            if (nodeElements.length === observed.length && nodeElements.every((el, i) => el === observed[i])) return;
            for (const element of observed) resizeObserver.unobserve(element);
            for (const element of nodeElements) resizeObserver.observe(element);
            observed = nodeElements;
            sync();
        };

        attach();
        const mutationObserver = new MutationObserver(attach);
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [enabled]);

    return sizes;
}

export function useBuildViewLayout(
    nodes: Node[],
    edges: Edge[],
    enabled: boolean,
): { nodes: Node[]; layoutKey: string } {
    const measuredJson = useRenderedNodeSizes(enabled);

    return useMemo(() => {
        if (!enabled || measuredJson === '') return { nodes, layoutKey: '' };

        const measured = new Map<string, Size>(
            (JSON.parse(measuredJson) as MeasuredEntry[]).map(([id, width, height]) => [id, { width, height }]),
        );

        if (nodes.some((node) => !measured.get(node.id)?.width || !measured.get(node.id)?.height)) {
            return { nodes, layoutKey: '' };
        }

        const sizes = new Map<string, Size>(
            nodes.map((node) => [node.id, effectiveSize(node, measured.get(node.id)!)]),
        );

        const satelliteIds = new Set(nodes.filter((node) => node.type === 'attach-node').map((node) => node.id));
        const isSatellite = (id: string) => satelliteIds.has(id);

        const satelliteParent = new Map<string, string>();
        for (const edge of edges) {
            if (satelliteIds.has(edge.target) && !satelliteIds.has(edge.source)) {
                satelliteParent.set(edge.target, edge.source);
            }
        }

        const authored = new Map<string, XYPosition>(nodes.map((node) => [node.id, node.position]));
        const positions = new Map<string, XYPosition>(authored);

        const byAuthoredOrder = (a: string, b: string) => {
            const first = authored.get(a)!;
            const second = authored.get(b)!;
            return first.x - second.x || first.y - second.y || a.localeCompare(b);
        };

        const mainIds = nodes
            .filter((node) => !satelliteIds.has(node.id))
            .map((node) => node.id)
            .sort(byAuthoredOrder);

        separate(mainIds, positions, authored, sizes, () => false);

        for (const [satelliteId, parentId] of satelliteParent) {
            const parentAuthored = authored.get(parentId);
            const parentResolved = positions.get(parentId);
            const satelliteAuthored = authored.get(satelliteId);
            if (!parentAuthored || !parentResolved || !satelliteAuthored) continue;
            positions.set(satelliteId, {
                x: satelliteAuthored.x + (parentResolved.x - parentAuthored.x),
                y: satelliteAuthored.y + (parentResolved.y - parentAuthored.y),
            });
        }

        separate([...mainIds, ...satelliteIds].sort(byAuthoredOrder), positions, authored, sizes, isSatellite);

        const deltas: [string, number, number][] = [];
        const laidOut = nodes.map((node) => {
            const position = positions.get(node.id) ?? node.position;
            const dx = Math.round(position.x - node.position.x);
            const dy = Math.round(position.y - node.position.y);
            if (dx !== 0 || dy !== 0) deltas.push([node.id, dx, dy]);
            return { ...node, measured: measured.get(node.id)!, position };
        });

        return { nodes: laidOut, layoutKey: `${JSON.stringify(deltas)}#${measuredJson}` };
    }, [nodes, edges, enabled, measuredJson]);
}
