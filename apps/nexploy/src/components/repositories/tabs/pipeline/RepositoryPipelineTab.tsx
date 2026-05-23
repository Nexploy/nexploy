import { getPipelineConfig } from '@/services/pipeline.service';
import { getBuildsPage } from '@/services/repository/build.service';
import { BUILDS_PAGE_SIZE } from '@/lib/constants';
import { PipelineEditorPage } from '@/components/pipeline/PipelineEditorPage';

interface RepositoryPipelineTabProps {
    repositoryId: string;
}

export async function RepositoryPipelineTab({ repositoryId }: RepositoryPipelineTabProps) {
    const [graph, initialBuilds] = await Promise.all([
        getPipelineConfig(repositoryId),
        getBuildsPage(repositoryId, undefined, BUILDS_PAGE_SIZE),
    ]);

    return (
        <PipelineEditorPage
            initialGraph={graph ?? { nodes: [], edges: [] }}
            initialBuilds={initialBuilds}
            initialHasMore={initialBuilds.length === BUILDS_PAGE_SIZE}
        />
    );
}
