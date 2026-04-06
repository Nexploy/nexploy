import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';

async function ensureDockerImage(imageName: string): Promise<void> {
    try {
        await docker.getImage(imageName).inspect();
    } catch {
        logger.info({ imageName }, `Pulling ${imageName} image...`);
        await new Promise<void>((resolve, reject) => {
            docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err: Error | null) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }
}

export async function createVolumeBackup(volumeName: string): Promise<Buffer> {
    await ensureDockerImage('alpine');

    logger.info({ volumeName }, 'Creating volume backup');

    const container = await docker.createContainer({
        Image: 'alpine',
        Cmd: ['tar', '-czf', '/tmp/backup.tar.gz', '-C', '/data', '.'],
        HostConfig: {
            Binds: [`${volumeName}:/data:ro`],
            AutoRemove: false,
        },
    });

    await container.start();
    await container.wait();

    logger.info({ volumeName }, 'Tar complete, fetching archive');

    const archiveStream = await container.getArchive({ path: '/tmp/backup.tar.gz' });

    const chunks: Buffer[] = [];
    for await (const chunk of archiveStream as AsyncIterable<Buffer>) {
        chunks.push(chunk);
    }
    const outerTar = Buffer.concat(chunks);

    container.remove({ force: true }).catch(() => {});

    const sizeStr = outerTar.slice(124, 136).toString('ascii').replace(/\x00/g, '').trim();
    const fileSize = parseInt(sizeStr, 8);
    const backupData = outerTar.slice(512, 512 + fileSize);

    logger.info({ volumeName, size: backupData.length }, 'Backup ready');

    return backupData;
}
