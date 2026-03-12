import { getPipelineConfig } from '@/services/pipeline.service';
import { getBuilds } from '@/services/repository.service';
import { PipelineEditorPage } from '@/components/pipeline/PipelineEditorPage';

interface RepositoryPipelineTabProps {
    repositoryId: string;
}

export async function RepositoryPipelineTab({ repositoryId }: RepositoryPipelineTabProps) {
    const [graph, builds] = await Promise.all([
        getPipelineConfig(repositoryId),
        getBuilds(repositoryId),
    ]);

    return <PipelineEditorPage initialGraph={graph ?? { nodes: [], edges: [] }} builds={builds} />;
}
