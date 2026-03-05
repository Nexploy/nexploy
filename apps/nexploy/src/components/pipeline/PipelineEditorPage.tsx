'use client';

import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { registerAllNodes } from '@/lib/pipeline/nodes';

// Register all nodes when this module is loaded on the client
registerAllNodes();

interface PipelineEditorPageProps {
    repositoryId: string;
    initialGraph: PipelineGraph;
}

export function PipelineEditorPage({ repositoryId, initialGraph }: PipelineEditorPageProps) {
    return (
        <div className="flex h-full flex-col">
            <PipelineEditor repositoryId={repositoryId} initialGraph={initialGraph} />
        </div>
    );
}
