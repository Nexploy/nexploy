import { scanImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ScanImageConfig } from '../config/ScanImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';

export const scanImageManifest: NodeManifest = {
    type: 'scan-image',
    definition: {
        id: 'scan-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'pipeline.nodes.scan-image.name',
            description: 'pipeline.nodes.scan-image.description',
            icon: 'ShieldCheck',
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        defaultConfig: {
            image: '',
            tag: 'latest',
            severity: 'HIGH',
            exitOnVulnerabilities: true,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: scanImageConfigSchema,
    configPanel: ScanImageConfig,
};
