'use client';

import { type NodeData } from '@nexploy/nodes/ui/nodeDefinition';
import type { NodeProgressState, NodeSummaryState } from '@workspace/typescript-interface/stores/pipelineStore';

export type NodeRunData = NodeData & {
    startedAt?: number;
    progress?: NodeProgressState;
    summary?: NodeSummaryState;
};

export function useNodeRunBody(data: NodeData): { showBody: boolean; alwaysOpen: boolean } {
    const runData = data as NodeRunData;
    const hasRunData =
        runData.status !== undefined || runData.durationMs !== undefined || runData.summary !== undefined;

    const isTerminalIssue =
        runData.status === 'failed' || runData.status === 'cancelled' || runData.status === 'not-configured';

    return {
        showBody: !!runData.viewOnly && hasRunData,
        alwaysOpen: runData.status === 'running' || runData.summary !== undefined || isTerminalIssue,
    };
}
