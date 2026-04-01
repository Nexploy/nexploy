import { delayConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { delayNodeDef } from '../definitions/delay.node';
import { DelayConfig } from '../config/DelayConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const delayManifest: NodeManifest = {
    type: 'delay',
    definition: delayNodeDef,
    configSchema: delayConfigSchema,
    configPanel: DelayConfig,
};
