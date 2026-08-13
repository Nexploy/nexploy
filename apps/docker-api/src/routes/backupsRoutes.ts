import { Hono } from 'hono';
import { HttpError } from '@nexploy/shared/http-error';
import { createVolumeBackup, restoreVolumeBackup } from '@/services/backupService';
import { route } from '@/utils/route';
import { volumeNameParamSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { volumeRestoreQuerySchema } from '@workspace/schemas-zod/docker/volume/volumeBackup.schema';
import { runTrackedTask } from '@/lib/taskRunner';

const app = new Hono();

app.get('/download/:volumeName', async (c) => {
    const volumeName = c.req.param('volumeName');

    if (!volumeName) {
        throw new HttpError('volumeName is required', 400);
    }

    const backupData = await createVolumeBackup(volumeName);
    const filename = `${volumeName}-${Date.now()}.tar.gz`;

    return new Response(new Uint8Array(backupData), {
        status: 200,
        headers: {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': String(backupData.length),
        },
    });
});

app.post(
    '/restore/:name',
    route(
        { param: volumeNameParamSchema, query: volumeRestoreQuerySchema },
        async (c) => {
            const { name: volumeName } = c.req.valid('param');
            const { overwrite } = c.req.valid('query');

            const archive = Buffer.from(await c.req.arrayBuffer());

            if (archive.length === 0) {
                throw new HttpError('Backup archive is empty.', 400);
            }

            return runTrackedTask({
                kind: 'volume-import',
                subjectName: volumeName,
                run: () => restoreVolumeBackup(volumeName, archive, overwrite),
            });
        },
        { timeoutMs: 900_000 },
    ),
);

export default app;
