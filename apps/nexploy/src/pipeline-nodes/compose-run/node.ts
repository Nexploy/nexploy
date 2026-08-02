import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { composeRunConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const composeRunDescriptor: NodeDescriptor = {
    type: 'compose-run',
    category: 'script',
    icon: 'Terminal',
    description:
        'Runs a one-off command in a compose service (docker compose run --rm), typically a migration or a bootstrap task, before the stack is started. Must be placed between compose-build and compose-up.',
    consumesFromUpstream: ['workDir', 'composeFile', 'projectName'],
    configSchema: composeRunConfigSchema,
    outputs: [{ key: 'exitCode' }, { key: 'service' }, { key: 'projectName' }, { key: 'composeFile' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
