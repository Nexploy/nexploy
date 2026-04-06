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
        category: 'utility',
        metadata: {
            name: 'pipeline.nodes.backup-volume-s3.name',
            description: 'pipeline.nodes.backup-volume-s3.description',
            icon: CloudBackup,
            color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: backupVolumeS3ConfigSchema,
    configPanel: BackupVolumeS3Config,
};
