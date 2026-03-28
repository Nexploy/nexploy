import { containerActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { removeContainerNodeDef } from '../definitions/remove-container.node';
import { RemoveContainerConfig } from '../config/RemoveContainerConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const removeContainerManifest: NodeManifest = {
    type: 'remove-container',
    definition: removeContainerNodeDef,
    configSchema: containerActionConfigSchema,
    configPanel: RemoveContainerConfig,
};
