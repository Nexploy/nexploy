'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageImportSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';

export const onImageImportAction = authActionServer
    .metadata({ name: 'image.import' })
    .use(requirePermission('image', 'pull'))
    .inputSchema(imageImportSchema)
    .action(async ({ parsedInput: { source, repo, tag } }) => {
        try {
            return await kyDocker
                .post('images/import', { json: { source, repo, tag } })
                .json<{ taskId: string; name: string }>();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
