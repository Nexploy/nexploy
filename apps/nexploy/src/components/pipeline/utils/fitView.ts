'use client';

import { useMemo } from 'react';
import type { FitViewOptions } from '@xyflow/react';
import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';

export const SIDE_PANEL_WIDTH = 288;
const SIDE_PANEL_INSET = 8;
const SIDE_PANEL_GAP = 80;
const BASE_PADDING = 0.15;

export function useFitViewOptions(): FitViewOptions {
    const activePanel = usePipelinePanelStore((s) => s.activePanel);

    return useMemo(() => {
        if (!activePanel) return { padding: BASE_PADDING };

        const right = `${SIDE_PANEL_WIDTH + SIDE_PANEL_INSET + SIDE_PANEL_GAP}px`;
        return { padding: { x: BASE_PADDING, y: BASE_PADDING, right } };
    }, [activePanel]);
}
