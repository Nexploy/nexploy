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
            {
                type: 'run-script',
                offsetX: 480,
                offsetY: 0,
                config: { script: 'docker compose up -d --build' },
            },
            { type: 'send-notification', offsetX: 720, offsetY: 0 },
        ],
        edges: [
            { sourceIndex: 0, targetIndex: 1 },
            { sourceIndex: 1, targetIndex: 2 },
            { sourceIndex: 2, targetIndex: 3 },
        ],
    },
];

export function getTemplate(id: string): PipelineTemplate | undefined {
    return PIPELINE_TEMPLATES.find((t) => t.id === id);
}
