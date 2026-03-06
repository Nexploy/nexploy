import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { RunScriptConfig } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT } from '@/components/pipeline/pipelineTheme';

export const runScriptNodeDef: NodeDefinition<RunScriptConfig> = {
    type: 'run-script',
    category: 'utility',
    metadata: {
        name: 'pipeline.nodes.run-script.name',
        description: 'pipeline.nodes.run-script.description',
        icon: 'Terminal',
        color: `${CATEGORY_BG_MUTED['utility']} ${CATEGORY_TEXT['utility']}`,
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
    validateConfig: (config) => config.script.trim().length > 0,
};
