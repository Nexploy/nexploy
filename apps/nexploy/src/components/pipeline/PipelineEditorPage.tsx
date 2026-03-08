'use client';

import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';
import { getActiveBuilds } from '@/services/repository.service';

type ActiveBuild = Awaited<ReturnType<typeof getActiveBuilds>>[number];

interface PipelineEditorPageProps {
    initialGraph: PipelineGraph;
    activeBuilds: ActiveBuild[];
}

export function PipelineEditorPage({ initialGraph, activeBuilds }: PipelineEditorPageProps) {
    return (
        <ReactFlowProvider>
            <PipelineProvider initialGraph={initialGraph} activeBuilds={activeBuilds}>
                <PipelineEditor />
            </PipelineProvider>
        </ReactFlowProvider>
    );
}
