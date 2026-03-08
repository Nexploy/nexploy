import { getPipelineConfig } from '@/services/pipeline.service';
import { getActiveBuilds } from '@/services/repository.service';
import { PipelineEditorPage } from '@/components/pipeline/PipelineEditorPage';

interface RepositoryPipelineTabProps {
    repositoryId: string;
}

export async function RepositoryPipelineTab({ repositoryId }: RepositoryPipelineTabProps) {
    const [graph, activeBuilds] = await Promise.all([
        getPipelineConfig(repositoryId),
        getActiveBuilds(repositoryId),
    ]);

    return (
        <PipelineEditorPage
            initialGraph={graph ?? { nodes: [], edges: [] }}
            activeBuilds={activeBuilds}
        />
    );
}
