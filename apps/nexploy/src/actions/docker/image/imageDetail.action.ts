'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { z } from 'zod';
import { ImageHistoryEntry } from '@workspace/typescript-interface/docker/docker.image';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';

const imageIdSchema = z.object({
    imageId: z.string().min(1),
});

export const getImageHistory = authActionServer
    .inputSchema(imageIdSchema)
    .action(async ({ parsedInput: { imageId } }) => {
        try {
            const data = await kyDocker.get(`images/${imageId}/history`).json<any[]>();

            return data.map((entry) => ({
                id: entry.Id || '<missing>',
                created: entry.Created || 0,
                createdBy: entry.CreatedBy || '',
                size: entry.Size || 0,
                comment: entry.Comment || '',
                tags: entry.Tags || null,
            })) as ImageHistoryEntry[];
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
