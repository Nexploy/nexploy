import { saveVersionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { saveVersionNodeDef } from '../definitions/save-version.node';
import { SaveVersionConfig } from '../config/SaveVersionConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const saveVersionManifest: NodeManifest = {
    type: 'save-version',
    definition: saveVersionNodeDef,
    configSchema: saveVersionConfigSchema,
    configPanel: SaveVersionConfig,
};
