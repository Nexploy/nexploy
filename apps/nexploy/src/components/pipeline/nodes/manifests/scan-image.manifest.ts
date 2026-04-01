import { scanImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { scanImageNodeDef } from '../definitions/scan-image.node';
import { ScanImageConfig } from '../config/ScanImageConfig';
import { type NodeManifest } from '../../types/nodeManifest';

export const scanImageManifest: NodeManifest = {
    type: 'scan-image',
    definition: scanImageNodeDef,
    configSchema: scanImageConfigSchema,
    configPanel: ScanImageConfig,
};
