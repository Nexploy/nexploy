'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { z } from 'zod';
import { ImageHistoryEntry } from '@workspace/typescript-interface/docker/docker.image';

const imageIdSchema = z.object({
    imageId: z.string().min(1),
});

export const getImageHistory = authActionServer
    .inputSchema(imageIdSchema)
    .action(async ({ parsedInput: { imageId } }) => {
        const data = await kyDocker.get(`images/${imageId}/history`).json<any[]>();

        return data.map((entry) => ({
            id: entry.Id || '<missing>',
            created: entry.Created || 0,
            createdBy: entry.CreatedBy || '',
            size: entry.Size || 0,
            comment: entry.Comment || '',
            tags: entry.Tags || null,
        })) as ImageHistoryEntry[];
    });
