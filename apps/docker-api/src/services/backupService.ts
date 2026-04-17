import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { ensureImage } from '@/utils/ensureImage';

export async function createVolumeBackup(volumeName: string): Promise<Buffer> {
    await ensureImage(docker, 'alpine');

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
