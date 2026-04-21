'use client';

import { useMemo } from 'react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';

export function usePipelineEnvironmentId() {
    const { nodes, edges } = usePipelineContext();
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
