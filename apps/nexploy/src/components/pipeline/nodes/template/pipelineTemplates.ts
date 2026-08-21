import { NodeId } from '@nexploy/nodes/core/node';

export type TemplateNode = {
    type: NodeId;
    config?: Record<string, unknown>;
};

export type TemplateEdge = {
    sourceIndex: number;
    targetIndex: number;
    sourceHandle?: string;
    targetHandle?: string;
};

export type PipelineTemplate = {
    id: string;
    icon: string;
    nodes: TemplateNode[];
    edges: TemplateEdge[];
};

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
    {
        id: 'dockerfile',
        icon: 'dockerfile',
        nodes: [{ type: 'clone-repository' }, { type: 'build-docker-image' }, { type: 'create-container' }],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },
    {
        id: 'docker-compose',
        icon: 'compose',
        nodes: [
            { type: 'clone-repository' },
            { type: 'validate-compose' },
            { type: 'deploy-compose' },
            { type: 'clean-workdir' },
            { type: 'save-version' },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 4, sourceHandle: 'save-version', targetHandle: 'input' },
        ],
    },
];

export function getTemplate(id: string): PipelineTemplate | undefined {
    return PIPELINE_TEMPLATES.find((t) => t.id === id);
}
