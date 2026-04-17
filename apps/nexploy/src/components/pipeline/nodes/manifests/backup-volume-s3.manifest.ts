import { backupVolumeS3ConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { BackupVolumeS3Config } from '../config/BackupVolumeS3Config';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { CloudBackup } from 'lucide-react';

export const backupVolumeS3Manifest: NodeManifest = {
    type: 'backup-volume-s3',
    definition: {
        id: 'backup-volume-s3',
        type: 'base-node',
        category: 'database',
        metadata: {
            name: 'backup-volume-s3.name',
            description: 'backup-volume-s3.description',
            icon: CloudBackup,
            color: `${CATEGORY_BG_MUTED['database']} ${CATEGORY_TEXT['database']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: backupVolumeS3ConfigSchema,
    configPanel: BackupVolumeS3Config,
    inputFields: [
        { key: 'fileName', labelKey: 'pipeline.inputs.fileName', descriptionKey: 'pipeline.inputs.desc_fileName', type: 'input' },
        { key: 'bucket', labelKey: 'pipeline.inputs.bucket', descriptionKey: 'pipeline.inputs.desc_bucket', type: 'input' },
        { key: 'volumeName', labelKey: 'pipeline.inputs.volumeName', descriptionKey: 'pipeline.inputs.desc_volumeName', type: 'input' },
    ],
};
