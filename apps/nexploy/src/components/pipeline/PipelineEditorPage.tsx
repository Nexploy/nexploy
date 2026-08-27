import { PipelineGraph } from '@nexploy/nodes/core/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/providers/PipelineProvider';
import { SSEProvider } from '@/providers/SSEProviders';
import { ReactFlowProvider } from '@xyflow/react';
import { PipelineBuild } from '@workspace/typescript-interface/stores/pipelineStore.ts';
import { RepositoryGitProviderProvider } from '@/contexts/RepositoryGitProviderContext';
import type { GitProviderType } from 'generated/client';
import '@xyflow/react/dist/style.css';

interface PipelineEditorPageProps {
    stageId: string;
    initialGraph: PipelineGraph;
    initialBuilds: PipelineBuild[];
    initialHasMore: boolean;
    gitProvider: GitProviderType;
}

export function PipelineEditorPage({
    stageId,
    initialGraph,
    initialBuilds,
    initialHasMore,
    gitProvider,
}: PipelineEditorPageProps) {
    return (
        <SSEProvider connections={['swarm']}>
            <ReactFlowProvider>
                <RepositoryGitProviderProvider gitProvider={gitProvider}>
                    <PipelineProvider
                        stageId={stageId}
                        initialGraph={initialGraph}
                        initialBuilds={initialBuilds}
                        initialHasMore={initialHasMore}
                    >
                        <PipelineEditor />
                    </PipelineProvider>
                </RepositoryGitProviderProvider>
            </ReactFlowProvider>
        </SSEProvider>
    );
}
