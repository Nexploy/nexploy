import { tagImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { tagImageNodeDef } from '../definitions/tag-image.node';
import { TagImageConfig } from '../config/TagImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const tagImageManifest: NodeManifest = {
    type: 'tag-image',
    definition: tagImageNodeDef,
    configSchema: tagImageConfigSchema,
    configPanel: TagImageConfig,
};
