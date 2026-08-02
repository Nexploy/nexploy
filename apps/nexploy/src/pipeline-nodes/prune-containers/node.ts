import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { pruneContainersConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const pruneContainersDescriptor: NodeDescriptor = {
    type: 'prune-containers',
    category: 'utility',
    icon: 'PackageX',
    description:
        'Removes all stopped containers (docker container prune) to free disk space. Use "olderThan" (e.g. 24h) to only remove containers stopped before that point, or "filter" (e.g. project=myapp) to restrict pruning to a label.',
    configSchema: pruneContainersConfigSchema,
    outputs: [{ key: 'removedContainers' }, { key: 'reclaimedSpace' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
