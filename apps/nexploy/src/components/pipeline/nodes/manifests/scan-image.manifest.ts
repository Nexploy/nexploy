import { scanImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ScanImageConfig } from '../config/ScanImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';

export const scanImageManifest: NodeManifest = {
    type: 'scan-image',
    definition: {
        id: 'scan-image',
        type: 'base-node',
        category: 'build',
        metadata: {
            name: 'scan-image.name',
            description: 'scan-image.description',
            icon: ShieldCheck,
            color: `${CATEGORY_BG_MUTED['build']} ${CATEGORY_TEXT['build']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: scanImageConfigSchema,
    configPanel: ScanImageConfig,
    inputFields: [
        { key: 'image', labelKey: 'pipeline.inputs.image', descriptionKey: 'pipeline.inputs.desc_image', type: 'input' },
        { key: 'tag', labelKey: 'pipeline.inputs.tag', descriptionKey: 'pipeline.inputs.desc_tag', type: 'input' },
        { key: 'vulnerabilities', labelKey: 'pipeline.inputs.vulnerabilities', descriptionKey: 'pipeline.inputs.desc_vulnerabilities', type: 'input' },
        { key: 'critical', labelKey: 'pipeline.inputs.critical', descriptionKey: 'pipeline.inputs.desc_critical', type: 'input' },
        { key: 'high', labelKey: 'pipeline.inputs.high', descriptionKey: 'pipeline.inputs.desc_high', type: 'input' },
    ],
};