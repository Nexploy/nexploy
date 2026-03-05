import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { RunScriptConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const runScriptNodeDef: NodeDefinition<RunScriptConfig> = {
    type: 'run-script',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.run-script.name',
        description: 'pipeline.nodes.run-script.description',
        icon: 'Terminal',
        color: 'bg-yellow-500/10 text-yellow-600',
    },
    defaultConfig: {
        script: '',
        timeout: 60000,
        failOnError: true,
    },
    handles: {
        inputs: [{ id: 'input', required: true }],
        outputs: [{ id: 'output' }],
    },
    validateConfig: (config) => typeof config.script === 'string' && config.script.trim().length > 0,
};
