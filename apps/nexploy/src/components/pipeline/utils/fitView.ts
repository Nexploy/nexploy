'use client';

import { useCallback, useMemo } from 'react';
import { useStore as useZustandStore } from 'zustand';
import { type FitViewOptions, useReactFlow, useStore } from '@xyflow/react';
import { usePipelineStoreInstance } from '@/contexts/PipelineContext';
import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';

export const SIDE_PANEL_WIDTH = 288;

const SIDE_PANEL_INSET = 8;
const OVERLAY_MARGIN = 32;
const EDGE_MARGIN = 64;
const BASE_PADDING = 0.12;
const BUILDS_PANEL_WIDTH = 256;

const SIDE_PANEL_OCCLUSION = `${SIDE_PANEL_WIDTH + SIDE_PANEL_INSET + OVERLAY_MARGIN}px`;
const BUILDS_PANEL_OCCLUSION = `${BUILDS_PANEL_WIDTH + OVERLAY_MARGIN}px`;

export const CANVAS_OVERLAY_ATTRIBUTE = 'data-canvas-overlay';

type Edges = { left: number; top: number; right: number; bottom: number };

export function useFitViewOptions(): FitViewOptions {
    const store = usePipelineStoreInstance();
    const activePanel = usePipelinePanelStore((s) => s.activePanel);
    const hasBuildsPanel = useZustandStore(store, (s) => s.builds.length > 0);

    return useMemo(
        () => ({
            padding: {
                top: BASE_PADDING,
                bottom: BASE_PADDING,
                left: hasBuildsPanel ? BUILDS_PANEL_OCCLUSION : BASE_PADDING,
                right: activePanel ? SIDE_PANEL_OCCLUSION : BASE_PADDING,
            },
        }),
        [activePanel, hasBuildsPanel],
    );
}

function readPaneEdges(pane: Element): Edges | null {
    const rect = pane.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function readVisibleEdges(pane: Edges): Edges {
    const visible: Edges = {
        left: pane.left + EDGE_MARGIN,
        top: pane.top + EDGE_MARGIN,
        right: pane.right - EDGE_MARGIN,
        bottom: pane.bottom - EDGE_MARGIN,
    };

    for (const overlay of document.querySelectorAll<HTMLElement>(`[${CANVAS_OVERLAY_ATTRIBUTE}]`)) {
        if (overlay.getAttribute('aria-hidden') === 'true') continue;
        const rect = overlay.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        if (overlay.getAttribute(CANVAS_OVERLAY_ATTRIBUTE) === 'left') {
            visible.left = Math.max(visible.left, rect.right + OVERLAY_MARGIN);
        } else {
            visible.right = Math.min(visible.right, rect.left - OVERLAY_MARGIN);
        }
    }

    return visible;
}

function readContentEdges(): Edges | null {
    let edges: Edges | null = null;

    for (const node of document.querySelectorAll<HTMLElement>('.react-flow__node')) {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        edges = edges
            ? {
                  left: Math.min(edges.left, rect.left),
                  top: Math.min(edges.top, rect.top),
                  right: Math.max(edges.right, rect.right),
                  bottom: Math.max(edges.bottom, rect.bottom),
              }
            : { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    }

    return edges;
}

export function useFitRenderedContent(): (duration?: number) => Promise<void> {
    const { getViewport, setViewport } = useReactFlow();
    const minZoom = useStore((s) => s.minZoom);
    const maxZoom = useStore((s) => s.maxZoom);
    const domNode = useStore((s) => s.domNode);

    return useCallback(
        async (duration?: number) => {
            const pane = domNode && readPaneEdges(domNode);
            const content = readContentEdges();
            if (!pane || !content) return;

            const viewport = getViewport();
            const contentWidth = (content.right - content.left) / viewport.zoom;
            const contentHeight = (content.bottom - content.top) / viewport.zoom;
            if (contentWidth === 0 || contentHeight === 0) return;

            const visible = readVisibleEdges(pane);
            const visibleWidth = visible.right - visible.left;
            const visibleHeight = visible.bottom - visible.top;
            if (visibleWidth <= 0 || visibleHeight <= 0) return;

            const zoom = Math.min(
                maxZoom,
                Math.max(minZoom, Math.min(visibleWidth / contentWidth, visibleHeight / contentHeight)),
            );

            const contentCenterX = (content.left + content.right) / 2 - pane.left;
            const contentCenterY = (content.top + content.bottom) / 2 - pane.top;
            const visibleCenterX = (visible.left + visible.right) / 2 - pane.left;
            const visibleCenterY = (visible.top + visible.bottom) / 2 - pane.top;

            await setViewport(
                {
                    x: visibleCenterX - ((contentCenterX - viewport.x) / viewport.zoom) * zoom,
                    y: visibleCenterY - ((contentCenterY - viewport.y) / viewport.zoom) * zoom,
                    zoom,
                },
                { duration },
            );
        },
        [domNode, getViewport, setViewport, minZoom, maxZoom],
    );
}
