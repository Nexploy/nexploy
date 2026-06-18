import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/providers/PipelineProvider';
import { ReactFlowProvider } from '@xyflow/react';
import { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore.ts';
import '@xyflow/react/dist/style.css';

interface PipelineEditorPageProps {
    stageId: string;
    initialGraph: PipelineGraph;
    initialBuilds: PipelineBuild[];
    initialHasMore: boolean;
}

export function PipelineEditorPage({
    stageId,
    initialGraph,
    initialBuilds,
    initialHasMore,
}: PipelineEditorPageProps) {
    return (
        <ReactFlowProvider>
            <PipelineProvider
                stageId={stageId}
                initialGraph={initialGraph}
                initialBuilds={initialBuilds}
                initialHasMore={initialHasMore}
            >
                <PipelineEditor />
            </PipelineProvider>
        </ReactFlowProvider>
    );
}
