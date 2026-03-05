'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { validatePipelineSchema } from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';
import { validatePipelineGraph } from '@/services/pipeline.service';

export const validatePipelineAction = authActionServer
    .inputSchema(validatePipelineSchema)
    .action(async ({ parsedInput }) => {
        return validatePipelineGraph(parsedInput.graph);
    });
