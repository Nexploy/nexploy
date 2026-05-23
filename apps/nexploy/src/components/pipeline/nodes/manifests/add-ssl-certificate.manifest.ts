import { Position } from '@xyflow/react';
import { addSslCertificateConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { AddSslCertificateConfig } from '../config/AddSslCertificateConfig';
import { type NodeManifest } from '../../types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';
import { ShieldCheck } from 'lucide-react';

export const addSslCertificateManifest: NodeManifest = {
    type: 'add-ssl-certificate',
    definition: {
        id: 'add-ssl-certificate',
        type: 'base-node',
        category: 'deploy',
        metadata: {
            name: 'add-ssl-certificate.name',
            description: 'add-ssl-certificate.description',
            icon: ShieldCheck,
            color: `${CATEGORY_BG_MUTED['deploy']} ${CATEGORY_TEXT['deploy']}`,
        },
        handles: {
            inputs: [{ id: 'input', position: Position.Left }],
            outputs: [{ id: 'output', position: Position.Right }],
            attachments: [],
        },
    },
    configSchema: addSslCertificateConfigSchema,
    configPanel: AddSslCertificateConfig,
};
