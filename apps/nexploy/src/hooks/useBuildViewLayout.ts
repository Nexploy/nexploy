import { useEffect, useMemo, useState } from 'react';
import { type Edge, type Node, Position, type XYPosition } from '@xyflow/react';
import type { NodeDefinition } from '@nexploy/nodes/ui/nodeDefinition';

type MeasuredEntry = [id: string, width: number, height: number];
type Size = { width: number; height: number };
type Offset = { dx: number; dy: number };

const H_MARGIN = 80;
const V_MARGIN = 60;
const LABEL_BELOW = 30;
const ATTACH_GAP = 50;
const ATTACH_SPREAD = 24;
const COLUMN_TOLERANCE = 60;

function effectiveSize(node: Node, size: Size): Size {
    const hasLabelBelow = node.type === 'base-node' || node.type === 'attach-node';
    return { width: size.width, height: size.height + (hasLabelBelow ? LABEL_BELOW : 0) };
}

function stackColumn(ids: string[], positions: Map<string, XYPosition>, sizes: Map<string, Size>): void {
    const desiredCenterY = new Map(ids.map((id) => [id, positions.get(id)!.y + sizes.get(id)!.height / 2]));
    const ordered = [...ids].sort((a, b) => desiredCenterY.get(a)! - desiredCenterY.get(b)! || a.localeCompare(b));

    const stackedY = new Map<string, number>();
    let lastBottom = Number.NEGATIVE_INFINITY;
    for (const id of ordered) {
        const height = sizes.get(id)!.height;
        const y = Math.max(desiredCenterY.get(id)! - height / 2, lastBottom + V_MARGIN);
        stackedY.set(id, y);
        lastBottom = y + height;
    }

    const desiredMean = ordered.reduce((sum, id) => sum + desiredCenterY.get(id)!, 0) / ordered.length;
    const stackedMean =
        ordered.reduce((sum, id) => sum + stackedY.get(id)! + sizes.get(id)!.height / 2, 0) / ordered.length;
    const shift = desiredMean - stackedMean;

    for (const id of ordered) positions.set(id, { x: positions.get(id)!.x, y: stackedY.get(id)! + shift });
}

function layoutColumns(
    ids: string[],
    positions: Map<string, XYPosition>,
    sizes: Map<string, Size>,
    authoredX: Map<string, number>,
): void {
    const ordered = [...ids].sort((a, b) => authoredX.get(a)! - authoredX.get(b)! || a.localeCompare(b));

    const columns: { anchorX: number; ids: string[] }[] = [];
    for (const id of ordered) {
        const column = columns[columns.length - 1];
        if (column && authoredX.get(id)! - column.anchorX <= COLUMN_TOLERANCE) column.ids.push(id);
        else columns.push({ anchorX: authoredX.get(id)!, ids: [id] });
    }

    let cursorX = Math.min(...ids.map((id) => positions.get(id)!.x));
    for (const column of columns) {
        const columnWidth = Math.max(...column.ids.map((id) => sizes.get(id)!.width));

        for (const id of column.ids) {
            const width = sizes.get(id)!.width;
            positions.set(id, { x: cursorX + (columnWidth - width) / 2, y: positions.get(id)!.y });
        }

        stackColumn(column.ids, positions, sizes);
        cursorX += columnWidth + H_MARGIN;
    }
}

function attachOffset(side: Position, parent: Size, satellite: Size, rank: number, total: number): Offset {
    const spread = rank - (total - 1) / 2;

    switch (side) {
        case Position.Top:
            return {
                dx: parent.width / 2 - satellite.width / 2 + spread * (satellite.width + ATTACH_SPREAD),
                dy: -(satellite.height + ATTACH_GAP),
            };
        case Position.Right:
            return {
                dx: parent.width + ATTACH_GAP,
                dy: parent.height / 2 - satellite.height / 2 + spread * (satellite.height + ATTACH_SPREAD),
            };
        case Position.Left:
            return {
                dx: -(satellite.width + ATTACH_GAP),
                dy: parent.height / 2 - satellite.height / 2 + spread * (satellite.height + ATTACH_SPREAD),
            };
        default:
            return {
                dx: parent.width / 2 - satellite.width / 2 + spread * (satellite.width + ATTACH_SPREAD),
                dy: parent.height + ATTACH_GAP,
            };
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

export function useBuildViewLayout(nodes: Node[], edges: Edge[], enabled: boolean): Node[] {
    const measuredJson = useRenderedNodeSizes(enabled);

    return useMemo(() => {
        if (!enabled || measuredJson === '') return nodes;

        const measured = new Map<string, Size>(
            (JSON.parse(measuredJson) as MeasuredEntry[]).map(([id, width, height]) => [id, { width, height }]),
        );

        if (nodes.some((node) => !measured.get(node.id)?.width || !measured.get(node.id)?.height)) return nodes;

        const sizes = new Map<string, Size>(
            nodes.map((node) => [node.id, effectiveSize(node, measured.get(node.id)!)]),
        );

        const nodeById = new Map(nodes.map((node) => [node.id, node]));
        const satelliteIds = new Set(nodes.filter((node) => node.type === 'attach-node').map((node) => node.id));

        const satelliteAnchor = new Map<string, { parentId: string; side: Position }>();
        for (const edge of edges) {
            if (!satelliteIds.has(edge.target) || satelliteIds.has(edge.source)) continue;
            const parent = nodeById.get(edge.source);
            if (!parent || !nodeById.has(edge.target) || satelliteAnchor.has(edge.target)) continue;
            const definition = parent.data?.definition as NodeDefinition | undefined;
            const attachment = definition?.handles?.attachments?.find((a) => a.id === edge.sourceHandle);
            satelliteAnchor.set(edge.target, {
                parentId: edge.source,
                side: attachment?.position ?? Position.Bottom,
            });
        }

        const sideGroups = new Map<string, string[]>();
        for (const [satelliteId, anchor] of satelliteAnchor) {
            const key = `${anchor.parentId}#${anchor.side}`;
            const group = sideGroups.get(key) ?? [];
            group.push(satelliteId);
            sideGroups.set(key, group);
        }
        for (const [, group] of sideGroups) group.sort((a, b) => a.localeCompare(b));

        const memberOffset = new Map<string, Offset>(nodes.map((node) => [node.id, { dx: 0, dy: 0 }]));
        const clusterMembers = new Map<string, string[]>();

        for (const node of nodes) {
            const anchor = satelliteAnchor.get(node.id);
            const clusterId = anchor?.parentId ?? node.id;
            const members = clusterMembers.get(clusterId) ?? [];
            members.push(node.id);
            clusterMembers.set(clusterId, members);

            if (!anchor) continue;
            const group = sideGroups.get(`${anchor.parentId}#${anchor.side}`)!;
            memberOffset.set(
                node.id,
                attachOffset(
                    anchor.side,
                    sizes.get(anchor.parentId)!,
                    sizes.get(node.id)!,
                    group.indexOf(node.id),
                    group.length,
                ),
            );
        }

        const clusterBoxOffset = new Map<string, Offset>();
        const clusterPositions = new Map<string, XYPosition>();
        const clusterSizes = new Map<string, Size>();

        for (const [clusterId, members] of clusterMembers) {
            const origin = nodeById.get(clusterId)!.position;
            let minX = Number.POSITIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;

            for (const id of members) {
                const offset = memberOffset.get(id)!;
                const size = sizes.get(id)!;
                minX = Math.min(minX, offset.dx);
                minY = Math.min(minY, offset.dy);
                maxX = Math.max(maxX, offset.dx + size.width);
                maxY = Math.max(maxY, offset.dy + size.height);
            }

            clusterBoxOffset.set(clusterId, { dx: minX, dy: minY });
            clusterPositions.set(clusterId, { x: origin.x + minX, y: origin.y + minY });
            clusterSizes.set(clusterId, { width: maxX - minX, height: maxY - minY });
        }

        const clusterAuthoredX = new Map(
            [...clusterMembers.keys()].map((clusterId) => [clusterId, nodeById.get(clusterId)!.position.x]),
        );

        layoutColumns([...clusterMembers.keys()], clusterPositions, clusterSizes, clusterAuthoredX);

        const positions = new Map<string, XYPosition>();
        for (const [clusterId, members] of clusterMembers) {
            const resolved = clusterPositions.get(clusterId)!;
            const boxOffset = clusterBoxOffset.get(clusterId)!;

            for (const id of members) {
                const offset = memberOffset.get(id)!;
                positions.set(id, {
                    x: resolved.x - boxOffset.dx + offset.dx,
                    y: resolved.y - boxOffset.dy + offset.dy,
                });
            }
        }

        return nodes.map((node) => ({
            ...node,
            measured: measured.get(node.id)!,
            position: positions.get(node.id) ?? node.position,
        }));
    }, [nodes, edges, enabled, measuredJson]);
}
