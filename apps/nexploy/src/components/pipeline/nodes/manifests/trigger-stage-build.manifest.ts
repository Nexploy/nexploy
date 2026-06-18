import { triggerStageBuildConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { TriggerStageBuildConfig } from '../config/TriggerStageBuildConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { Position } from '@xyflow/react';
import { Workflow } from 'lucide-react';

export const triggerStageBuildManifest: NodeManifest = {
    type: 'trigger-stage-build',
    definition: {
        id: 'trigger-stage-build',
        type: 'stage-node',
        category: 'deploy',
        metadata: {
            name: 'trigger-stage-build.name',
            description: 'trigger-stage-build.description',
            icon: Workflow,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: triggerStageBuildConfigSchema,
    configPanel: TriggerStageBuildConfig,
};
