import { templateFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { TemplateFileConfig } from '../config/TemplateFileConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { FileCode } from 'lucide-react';

export const templateFileManifest: NodeManifest = {
    type: 'template-file',
    definition: {
        id: 'template-file',
        type: 'base-node',
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.template-file.name',
            description: 'pipeline.nodes.template-file.description',
            icon: FileCode,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        defaultConfig: {
            inputPath: '',
            outputPath: '',
            variables: [],
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: templateFileConfigSchema,
    configPanel: TemplateFileConfig,
};
