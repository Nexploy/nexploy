import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { backupVolumeBucketStorageConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const backupVolumeBucketStorageDescriptor: NodeDescriptor = {
    type: 'backup-volume-bucket-storage',
    category: 'database',
    icon: 'CloudBackup',
    description: 'Backs up a Docker volume to an object-storage bucket.',
    configSchema: backupVolumeBucketStorageConfigSchema,
    outputs: [
        { key: 'fileName' },
        { key: 'bucket' },
        { key: 'volumeName', labelKey: 'pipeline.inputs.backupVolumeName' },
    ],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
