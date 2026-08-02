import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { scanImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const scanImageDescriptor: NodeDescriptor = {
    type: 'scan-image',
    category: 'build',
    icon: 'ShieldCheck',
    description: 'Scans a Docker image for vulnerabilities using Trivy.',
    consumesFromUpstream: ['imageId'],
    configSchema: scanImageConfigSchema,
    outputs: [{ key: 'image' }, { key: 'vulnerabilities' }, { key: 'critical' }, { key: 'high' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
