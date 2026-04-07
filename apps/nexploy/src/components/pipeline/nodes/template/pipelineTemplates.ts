import { NodeId } from '@workspace/typescript-interface/pipeline/node';

export type TemplateNode = {
    type: NodeId;
    offsetX: number;
    offsetY: number;
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
        nodes: [
            { type: 'clone-repository', offsetX: 0, offsetY: 0 },
            { type: 'inject-env-vars', offsetX: 240, offsetY: 0 },
            { type: 'build-docker-image', offsetX: 480, offsetY: 0 },
            { type: 'deploy-container', offsetX: 720, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
        ],
    },
    {
        id: 'docker-compose',
        icon: 'compose',
        nodes: [
            { type: 'clone-repository', offsetX: 0, offsetY: 0 },
            { type: 'inject-env-vars', offsetX: 220, offsetY: 0 },
            { type: 'validate-compose', offsetX: 420, offsetY: 0 },
            { type: 'deploy-compose', offsetX: 620, offsetY: 0 },
            { type: 'clean-workdir', offsetX: 1020, offsetY: 0 },
            { type: 'save-version', offsetX: 680, offsetY: 260 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 1, targetIndex: 2, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 2, targetIndex: 3, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 4, sourceHandle: 'output', targetHandle: 'input' },
            { sourceIndex: 3, targetIndex: 5, sourceHandle: 'save-version', targetHandle: 'input' },
        ],
    },
];

export function getTemplate(id: string): PipelineTemplate | undefined {
    return PIPELINE_TEMPLATES.find((t) => t.id === id);
}
