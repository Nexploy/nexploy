import { getPipelineConfig } from '@/services/pipeline.service';
import { PipelineEditorPage } from '@/components/pipeline/PipelineEditorPage';

interface RepositoryPipelineTabProps {
    repositoryId: string;
}

export async function RepositoryPipelineTab({ repositoryId }: RepositoryPipelineTabProps) {
    const graph = await getPipelineConfig(repositoryId);

    return (
        <div className="flex h-[calc(100vh-12rem)] flex-col">
            <PipelineEditorPage
                repositoryId={repositoryId}
                initialGraph={graph ?? { nodes: [], edges: [] }}
            />
        </div>
    );
}
