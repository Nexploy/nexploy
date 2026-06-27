import { backupVolumeBucketStorageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { BackupVolumeBucketStorageConfig } from '../config/BackupVolumeBucketStorageConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { Position } from '@xyflow/react';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { CloudBackup } from 'lucide-react';

export const backupVolumeBucketStorageManifest: NodeManifest = {
    type: 'backup-volume-bucket-storage',
    definition: {
        id: 'backup-volume-bucket-storage',
        type: 'base-node',
        category: 'database',
        metadata: {
            name: 'backup-volume-bucket-storage.name',
            description: 'backup-volume-bucket-storage.description',
            icon: CloudBackup,
            color: `${CATEGORY_BG_MUTED['database']} ${CATEGORY_TEXT['database']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: backupVolumeBucketStorageConfigSchema,
    configPanel: BackupVolumeBucketStorageConfig,
    inputFields: [
        {
            key: 'fileName',
            labelKey: 'pipeline.inputs.fileName',
            descriptionKey: 'pipeline.inputs.desc_fileName',
            type: 'input',
        },
        {
            key: 'bucket',
            labelKey: 'pipeline.inputs.bucket',
            descriptionKey: 'pipeline.inputs.desc_bucket',
            type: 'input',
        },
        {
            key: 'volumeName',
            labelKey: 'pipeline.inputs.backupVolumeName',
            type: 'input',
        },
    ],
};
