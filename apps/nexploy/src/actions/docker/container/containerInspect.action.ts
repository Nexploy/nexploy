'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { z } from 'zod';

const ContainerInspectSchema = z.object({
    containerId: z.string(),
});

export const containerInspectAction = actionServer
    .inputSchema(ContainerInspectSchema)
    .action(async ({ parsedInput: { containerId } }) => {
        const response = await drinoDocker.get(`/container/${containerId}/info`).consume();
        return response;
    });
