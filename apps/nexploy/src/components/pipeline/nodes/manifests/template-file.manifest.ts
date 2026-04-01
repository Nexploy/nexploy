import { templateFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { templateFileNodeDef } from '../definitions/template-file.node';
import { TemplateFileConfig } from '../config/TemplateFileConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const templateFileManifest: NodeManifest = {
    type: 'template-file',
    definition: templateFileNodeDef,
    configSchema: templateFileConfigSchema,
    configPanel: TemplateFileConfig,
};
