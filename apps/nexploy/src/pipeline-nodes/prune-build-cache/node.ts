import { NodeDescriptor } from '@workspace/pipeline-core/nodeDescriptor';
import { pruneBuildCacheConfigSchema } from '@workspace/pipeline-core/schemas/nodeConfigs.schema';

export const pruneBuildCacheDescriptor: NodeDescriptor = {
    type: 'prune-build-cache',
    category: 'build',
    icon: 'Eraser',
    description:
        'Clears the Docker build cache (docker builder prune) to free disk space. Use "all" to also remove cache still in use, "keepStorage" (e.g. 10GB) to cap retained cache, or "filter" (e.g. until=24h) to target old entries.',
    configSchema: pruneBuildCacheConfigSchema,
    outputs: [{ key: 'deletedCaches' }, { key: 'reclaimedSpace' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
