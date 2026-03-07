import { NodeType } from '@workspace/typescript-interface/pipeline/node';

export type TemplateNode = {
    type: NodeType;
    offsetX: number;
    offsetY: number;
    config?: Record<string, unknown>;
};

export type TemplateEdge = {
    sourceIndex: number;
    targetIndex: number;
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
            { type: 'write-env-file', offsetX: 240, offsetY: 0 },
            { type: 'build-docker-image', offsetX: 480, offsetY: 0 },
            { type: 'deploy-container', offsetX: 720, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1 },
            { sourceIndex: 1, targetIndex: 2 },
            { sourceIndex: 2, targetIndex: 3 },
        ],
    },
    {
        id: 'docker-compose',
        icon: 'compose',
        nodes: [
            { type: 'clone-repository', offsetX: 0, offsetY: 0 },
            { type: 'write-env-file', offsetX: 240, offsetY: 0 },
            { type: 'validate-compose', offsetX: 480, offsetY: 0 },
            { type: 'deploy-compose', offsetX: 720, offsetY: 0 },
            { type: 'clean-workdir', offsetX: 960, offsetY: 0 },
            { type: 'send-notification', offsetX: 1200, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1 },
            { sourceIndex: 1, targetIndex: 2 },
            { sourceIndex: 2, targetIndex: 3 },
            { sourceIndex: 3, targetIndex: 4 },
            { sourceIndex: 4, targetIndex: 5 },
        ],
    },
];

export function getTemplate(id: string): PipelineTemplate | undefined {
    return PIPELINE_TEMPLATES.find((t) => t.id === id);
}
