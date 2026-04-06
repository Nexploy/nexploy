import { Hono } from 'hono';
import { HttpError } from '@workspace/shared/http-error';
import { createVolumeBackup } from '@/services/backupService';

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

export default app;
