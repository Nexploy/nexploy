import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { runCommandInContainerConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const runCommandInContainerDescriptor: NodeDescriptor = {
    type: 'run-command-in-container',
    category: 'script',
    icon: 'SquareTerminal',
    description: 'Runs a shell command inside a running container.',
    consumesFromUpstream: ['containerId'],
    configSchema: runCommandInContainerConfigSchema,
    outputs: [{ key: 'exitCode' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
