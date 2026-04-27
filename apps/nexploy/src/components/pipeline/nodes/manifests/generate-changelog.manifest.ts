import { Position } from '@xyflow/react';
import { generateChangelogConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { GenerateChangelogConfig } from '../config/GenerateChangelogConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { NotepadText } from 'lucide-react';

export const generateChangelogManifest: NodeManifest = {
    type: 'generate-changelog',
    definition: {
        id: 'generate-changelog',
        type: 'base-node',
        category: 'source',
        metadata: {
            name: 'generate-changelog.name',
            description: 'generate-changelog.description',
            icon: NotepadText,
            color: `${CATEGORY_BG_MUTED['source']} ${CATEGORY_TEXT['source']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: generateChangelogConfigSchema,
    configPanel: GenerateChangelogConfig,
    inputFields: [
        {
            key: 'changelogPath',
            labelKey: 'pipeline.inputs.changelogPath',
            descriptionKey: 'pipeline.inputs.desc_changelogPath',
            type: 'input',
        },
        {
            key: 'changelog',
            labelKey: 'pipeline.inputs.changelog',
            descriptionKey: 'pipeline.inputs.desc_changelog',
            type: 'input',
        },
        {
            key: 'workDir',
            labelKey: 'pipeline.inputs.workDir',
            descriptionKey: 'pipeline.inputs.desc_workDir',
            type: 'input',
        },
    ],
};
