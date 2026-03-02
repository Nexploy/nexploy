import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { Hono } from 'hono';
import { HttpError } from '@workspace/shared/http-error';

const app = new Hono();

async function ensureAlpineImage(): Promise<void> {
    try {
        await docker.getImage('alpine').inspect();
    } catch {
        logger.info('Pulling alpine image...');
        await new Promise<void>((resolve, reject) => {
            docker.pull('alpine:latest', (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err: Error | null) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }
}

// GET /api/backups/download/:volumeName
app.get('/download/:volumeName', async (c) => {
    const volumeName = c.req.param('volumeName');

    if (!volumeName) {
        throw new HttpError('volumeName is required', 400);
    }

    await ensureAlpineImage();

    logger.info({ volumeName }, 'Creating volume backup');

    // Step 1: Run tar into a file inside the container (not stdout)
    const container = await docker.createContainer({
        Image: 'alpine',
        Cmd: ['tar', '-czf', '/tmp/backup.tar.gz', '-C', '/data', '.'],
        HostConfig: {
            Binds: [`${volumeName}:/data:ro`],
            AutoRemove: false,
        },
    });

    await container.start();
    // container.wait() is a simple HTTP call — reliable, no stream issues
    await container.wait();

    logger.info({ volumeName }, 'Tar complete, fetching archive');

    // Step 2: Retrieve the file via Docker copy API (raw HTTP stream, NOT multiplexed)
    const archiveStream = await container.getArchive({ path: '/tmp/backup.tar.gz' });

    const chunks: Buffer[] = [];
    for await (const chunk of archiveStream as AsyncIterable<Buffer>) {
        chunks.push(chunk);
    }
    const outerTar = Buffer.concat(chunks);

    container.remove({ force: true }).catch(() => {});

    // Step 3: Unwrap the outer tar wrapper to get the actual .tar.gz content
    // Tar header: bytes 124–135 contain file size as octal ASCII
    const sizeStr = outerTar.slice(124, 136).toString('ascii').replace(/\x00/g, '').trim();
    const fileSize = parseInt(sizeStr, 8);
    const backupData = outerTar.slice(512, 512 + fileSize);

    logger.info({ volumeName, size: backupData.length }, 'Backup ready');

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
