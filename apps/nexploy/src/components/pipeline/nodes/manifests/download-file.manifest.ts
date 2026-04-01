import { downloadFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { downloadFileNodeDef } from '../definitions/download-file.node';
import { DownloadFileConfig } from '../config/DownloadFileConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const downloadFileManifest: NodeManifest = {
    type: 'download-file',
    definition: downloadFileNodeDef,
    configSchema: downloadFileConfigSchema,
    configPanel: DownloadFileConfig,
};
