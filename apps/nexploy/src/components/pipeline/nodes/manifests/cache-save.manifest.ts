import { Position } from '@xyflow/react';
import { cacheSaveConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CacheSaveConfig } from '../config/CacheSaveConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { FolderOutput } from 'lucide-react';

export const cacheSaveManifest: NodeManifest = {
    type: 'cache-save',
    definition: {
        id: 'cache-save',
        type: 'base-node',
        category: 'files',
        metadata: {
            name: 'cache-save.name',
            description: 'cache-save.description',
            icon: FolderOutput,
            color: `${CATEGORY_BG_MUTED['files']} ${CATEGORY_TEXT['files']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: cacheSaveConfigSchema,
    configPanel: CacheSaveConfig,
    inputFields: [
        { key: 'saved', labelKey: 'pipeline.inputs.saved', descriptionKey: 'pipeline.inputs.desc_saved', type: 'input' },
        { key: 'files', labelKey: 'pipeline.inputs.files', descriptionKey: 'pipeline.inputs.desc_files', type: 'input' },
        { key: 'sizeBytes', labelKey: 'pipeline.inputs.sizeBytes', descriptionKey: 'pipeline.inputs.desc_sizeBytes', type: 'input' },
    ],
};