import { getPipelineConfig } from '@/services/pipeline.service';
import { PipelineEditorPage } from '@/components/pipeline/PipelineEditorPage';

interface RepositoryPipelineTabProps {
    repositoryId: string;
}

export async function RepositoryPipelineTab({ repositoryId }: RepositoryPipelineTabProps) {
    const graph = await getPipelineConfig(repositoryId);

    return <PipelineEditorPage initialGraph={graph ?? { nodes: [], edges: [] }} />;
}
