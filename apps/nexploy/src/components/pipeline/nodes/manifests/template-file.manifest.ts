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
        category: 'files',
        metadata: {
            name: 'template-file.name',
            description: 'template-file.description',
            icon: FileCode,
            color: `${CATEGORY_BG_MUTED['files']} ${CATEGORY_TEXT['files']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: templateFileConfigSchema,
    configPanel: TemplateFileConfig,
    inputFields: [
        { key: 'inputPath', labelKey: 'pipeline.inputs.inputPath', descriptionKey: 'pipeline.inputs.desc_inputPath', type: 'input' },
        { key: 'outputPath', labelKey: 'pipeline.inputs.outputPath', descriptionKey: 'pipeline.inputs.desc_outputPath', type: 'input' },
        { key: 'substitutions', labelKey: 'pipeline.inputs.substitutions', descriptionKey: 'pipeline.inputs.desc_substitutions', type: 'input' },
    ],
};