const EDGE_PROXIMITY_THRESHOLD = 15;

export function getEdgeIdAtPosition(
    clientX: number,
    clientY: number,
    excludeEdgeIds?: Set<string>,
): string | null {
    const edgePaths = document.querySelectorAll<SVGGeometryElement>(
        '.react-flow__edge path.react-flow__edge-path',
    );

    for (const pathEl of Array.from(edgePaths)) {
        const edgeId = pathEl.closest('.react-flow__edge')?.getAttribute('data-id');
        if (!edgeId) continue;
        if (excludeEdgeIds?.has(edgeId)) continue;

        const ctm = pathEl.getScreenCTM();
        if (!ctm) continue;

        const pathLength = pathEl.getTotalLength();
        const steps = Math.max(20, Math.floor(pathLength / 8));

        for (let i = 0; i <= steps; i++) {
            const pt = pathEl.getPointAtLength((i / steps) * pathLength);
            const screenX = ctm.a * pt.x + ctm.c * pt.y + ctm.e;
            const screenY = ctm.b * pt.x + ctm.d * pt.y + ctm.f;

            if (
                Math.sqrt((screenX - clientX) ** 2 + (screenY - clientY) ** 2) <
                EDGE_PROXIMITY_THRESHOLD
            ) {
                return edgeId;
            }
        }
    }

    return null;
}
