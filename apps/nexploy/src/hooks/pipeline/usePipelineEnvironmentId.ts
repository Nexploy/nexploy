'use client';

import { useMemo } from 'react';
import { usePipelineStore } from '@/stores/pipeline/usePipelineStore';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';

export function usePipelineEnvironmentId() {
    const { nodes, edges } = usePipelineStore();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    return useMemo(() => {
        if (!panelNodeId) return undefined;
        const ancestor = findAncestor(
            panelNodeId,
            nodes,
            edges,
            (data) => data.nodeType === 'set-environment' && !data.disabled,
        );
        return ancestor?.data.config?.environmentId ?? undefined;
    }, [panelNodeId, nodes, edges]);
}
