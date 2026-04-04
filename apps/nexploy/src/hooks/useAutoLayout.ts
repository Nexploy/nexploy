import { useCallback } from 'react';
import { Position, useReactFlow } from '@xyflow/react';
import { usePipelineActions } from '@/contexts/PipelineContext';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';

const H_GAP = 80;
const V_GAP = 120;
const LABEL_BELOW = 0;
const ATTACH_GAP = 50;
const FALLBACK_SIZE = 60;

function effectiveHeight(type: string | undefined, measuredH: number): number {
    if (type === 'base-node' || type === 'attach-node') return measuredH + LABEL_BELOW;
    return measuredH;
}

function outputHandleIdx(
    node: ReturnType<ReturnType<typeof useReactFlow>['getNodes']>[number] | undefined,
    handleId: string | undefined,
): number {
    if (!node || !handleId) return 0;
    const outputs = (node.data?.definition as NodeDefinition | undefined)?.handles?.outputs ?? [];
    const idx = outputs.findIndex((h) => h.id === handleId);
    return idx >= 0 ? idx : 0;
}

function spreadNodes(
    ids: string[],
    desiredCenterY: Map<string, number>,
    effHeights: Map<string, number>,
): Map<string, number> {
    const sorted = [...ids].sort(
        (a, b) => (desiredCenterY.get(a) ?? 0) - (desiredCenterY.get(b) ?? 0),
    );

    const topY = new Map<string, number>();
    let lastBottom = -Infinity;
    for (const id of sorted) {
        const h = effHeights.get(id) ?? FALLBACK_SIZE;
        const desired = (desiredCenterY.get(id) ?? 0) - h / 2;
        const y = Math.max(desired, lastBottom + V_GAP);
        topY.set(id, y);
        lastBottom = y + h;
    }

    const desiredMean =
        sorted.reduce((s, id) => s + (desiredCenterY.get(id) ?? 0), 0) / sorted.length;
    const actualMean =
        sorted.reduce((s, id) => {
            const h = effHeights.get(id) ?? FALLBACK_SIZE;
            return s + (topY.get(id) ?? 0) + h / 2;
        }, 0) / sorted.length;
    const shift = desiredMean - actualMean;

    const result = new Map<string, number>();
    for (const id of sorted) result.set(id, (topY.get(id) ?? 0) + shift);
    return result;
}

export function useAutoLayout() {
    const { getNodes, getEdges, fitView } = useReactFlow();
    const { setNodes, triggerAutoSave } = usePipelineActions();

    return useCallback(() => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();

        const nodeById = new Map(currentNodes.map((n) => [n.id, n]));

        const attachNodeIds = new Set(
            currentNodes.filter((n) => n.type === 'attach-node').map((n) => n.id),
        );
        const mainNodes = currentNodes.filter((n) => !attachNodeIds.has(n.id));

        const inDegree = new Map<string, number>();
        const succ = new Map<string, { targetId: string; handleIdx: number }[]>();
        const pred = new Map<string, string[]>();

        for (const node of mainNodes) {
            inDegree.set(node.id, 0);
            succ.set(node.id, []);
            pred.set(node.id, []);
        }
        for (const edge of currentEdges) {
            if (attachNodeIds.has(edge.source) || attachNodeIds.has(edge.target)) continue;
            inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
            const handleIdx = outputHandleIdx(
                nodeById.get(edge.source),
                edge.sourceHandle ?? undefined,
            );
            succ.get(edge.source)?.push({ targetId: edge.target, handleIdx });
            pred.get(edge.target)?.push(edge.source);
        }

        for (const [, list] of succ) list.sort((a, b) => a.handleIdx - b.handleIdx);

        const layers = new Map<string, number>();
        const layerOrder = new Map<string, number>();
        const queue: string[] = [];

        let sourceIdx = 0;
        for (const [id, deg] of inDegree) {
            if (deg === 0) {
                queue.push(id);
                layers.set(id, 0);
                layerOrder.set(id, sourceIdx++);
            }
        }

        const remaining = new Map(inDegree);
        while (queue.length > 0) {
            const id = queue.shift()!;
            const layer = layers.get(id) ?? 0;
            const parentOrder = layerOrder.get(id) ?? 0;
            for (const { targetId, handleIdx } of succ.get(id) ?? []) {
                const newLayer = layer + 1;
                if ((layers.get(targetId) ?? -1) < newLayer) {
                    layers.set(targetId, newLayer);
                    layerOrder.set(targetId, parentOrder * 100 + handleIdx);
                }
                remaining.set(targetId, (remaining.get(targetId) ?? 1) - 1);
                if (remaining.get(targetId) === 0) queue.push(targetId);
            }
        }
        for (const node of mainNodes) {
            if (!layers.has(node.id)) {
                layers.set(node.id, 0);
                layerOrder.set(node.id, 0);
            }
        }

        const layerGroups = new Map<number, string[]>();
        for (const [id, layer] of layers) {
            if (!layerGroups.has(layer)) layerGroups.set(layer, []);
            layerGroups.get(layer)!.push(id);
        }
        for (const [, ids] of layerGroups) {
            ids.sort((a, b) => (layerOrder.get(a) ?? 0) - (layerOrder.get(b) ?? 0));
        }

        const maxLayerCount = Math.max(0, ...layerGroups.keys()) + 1;
        const columnX: number[] = [];
        let curX = 0;
        for (let l = 0; l < maxLayerCount; l++) {
            columnX[l] = curX;
            const ids = layerGroups.get(l) ?? [];
            const maxW = Math.max(
                ...ids.map((id) => nodeById.get(id)?.measured?.width ?? FALLBACK_SIZE),
            );
            curX += maxW + H_GAP;
        }

        const effHeights = new Map<string, number>();
        for (const node of mainNodes) {
            effHeights.set(
                node.id,
                effectiveHeight(node.type, node.measured?.height ?? FALLBACK_SIZE),
            );
        }

        const positionMap = new Map<string, { x: number; y: number }>();

        const sortedLayers = [...layerGroups.keys()].sort((a, b) => a - b);
        for (const layer of sortedLayers) {
            const ids = layerGroups.get(layer)!;
            const x = columnX[layer] ?? 0;

            if (layer === 0) {
                const totalH =
                    ids.reduce((s, id) => s + (effHeights.get(id) ?? FALLBACK_SIZE), 0) +
                    (ids.length - 1) * V_GAP;
                let y = -totalH / 2;
                for (const id of ids) {
                    const h = effHeights.get(id) ?? FALLBACK_SIZE;
                    positionMap.set(id, { x, y });
                    y += h + V_GAP;
                }
            } else {
                const desiredCenterY = new Map<string, number>();
                for (const id of ids) {
                    const preds = pred.get(id) ?? [];
                    if (preds.length === 0) {
                        desiredCenterY.set(id, 0);
                    } else {
                        const mean =
                            preds.reduce((s, srcId) => {
                                const pos = positionMap.get(srcId);
                                const h = nodeById.get(srcId)?.measured?.height ?? FALLBACK_SIZE;
                                return s + (pos?.y ?? 0) + h / 2;
                            }, 0) / preds.length;
                        desiredCenterY.set(id, mean);
                    }
                }

                const topYs = spreadNodes(ids, desiredCenterY, effHeights);
                for (const id of ids) {
                    positionMap.set(id, { x, y: topYs.get(id) ?? 0 });
                }
            }
        }

        for (const edge of currentEdges) {
            if (!attachNodeIds.has(edge.target)) continue;
            const parent = nodeById.get(edge.source);
            if (!parent || !positionMap.has(parent.id)) continue;

            const definition = parent.data?.definition as NodeDefinition | undefined;
            const attachment = definition?.handles?.attachments?.find(
                (a) => a.id === edge.sourceHandle,
            );
            const attachPos: Position = attachment?.position ?? Position.Bottom;

            const parentPos = positionMap.get(parent.id)!;
            const parentW = parent.measured?.width ?? FALLBACK_SIZE;
            const parentH = parent.measured?.height ?? FALLBACK_SIZE;
            const attachW = nodeById.get(edge.target)?.measured?.width ?? FALLBACK_SIZE;
            const attachH = nodeById.get(edge.target)?.measured?.height ?? FALLBACK_SIZE;

            let ax: number;
            let ay: number;

            switch (attachPos) {
                case Position.Bottom:
                    ax = parentPos.x + parentW / 2 - attachW / 2;
                    ay = parentPos.y + parentH + ATTACH_GAP;
                    break;
                case Position.Top:
                    ax = parentPos.x + parentW / 2 - attachW / 2;
                    ay = parentPos.y - attachH - ATTACH_GAP;
                    break;
                case Position.Right:
                    ax = parentPos.x + parentW + ATTACH_GAP;
                    ay = parentPos.y + parentH / 2 - attachH / 2;
                    break;
                case Position.Left:
                default:
                    ax = parentPos.x - attachW - ATTACH_GAP;
                    ay = parentPos.y + parentH / 2 - attachH / 2;
                    break;
            }

            positionMap.set(edge.target, { x: ax, y: ay });
        }

        for (const id of attachNodeIds) {
            if (!positionMap.has(id)) {
                const node = nodeById.get(id);
                if (node) positionMap.set(id, node.position);
            }
        }

        setNodes((nodes) =>
            nodes.map((node) => {
                const pos = positionMap.get(node.id);
                return pos ? { ...node, position: pos } : node;
            }),
        );

        triggerAutoSave();
        requestAnimationFrame(() => fitView({ padding: 0.3 }));
    }, [getNodes, getEdges, setNodes, triggerAutoSave, fitView]);
}
