import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { ensureImage } from '@/utils/ensureImage';
import { HttpError } from '@nexploy/shared/http-error';
import { parseDockerLogs } from '@/utils/parseDockerLogs';
import { createSingleFileTar } from '@/utils/singleFileTar';

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

async function volumeExists(volumeName: string): Promise<boolean> {
    try {
        await docker.getVolume(volumeName).inspect();
        return true;
    } catch (err: any) {
        if (err.statusCode === 404) return false;
        throw err;
    }
}

export async function restoreVolumeBackup(
    volumeName: string,
    archive: Buffer,
    overwrite: boolean,
): Promise<{ volumeName: string; created: boolean; sizeBytes: number }> {
    const exists = await volumeExists(volumeName);

    if (exists && !overwrite) {
        throw new HttpError(`Volume ${volumeName} already exists.`, 409);
    }

    await ensureImage(docker, 'alpine');

    if (!exists) {
        await docker.createVolume({ Name: volumeName });
    }

    logger.info({ volumeName, size: archive.length, overwrite }, 'Restoring volume backup');

    const extractScript = [
        overwrite ? 'rm -rf /data/..?* /data/.[!.]* /data/*' : ':',
        'tar -xzf /tmp/backup.tar.gz -C /data',
    ].join('\n');

    const container = await docker.createContainer({
        Image: 'alpine',
        Cmd: ['sh', '-c', extractScript],
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: {
            Binds: [`${volumeName}:/data`],
            AutoRemove: false,
        },
    });

    try {
        await container.putArchive(createSingleFileTar('backup.tar.gz', archive), { path: '/tmp' });
        await container.start();
        const { StatusCode } = await container.wait();

        if (StatusCode !== 0) {
            const logBuffer = (await container.logs({ stdout: true, stderr: true })) as Buffer;
            const output = parseDockerLogs(logBuffer).trim();
            throw new HttpError(output || `Restore of volume ${volumeName} failed.`, 400);
        }
    } finally {
        container.remove({ force: true }).catch(() => {});
    }

    logger.info({ volumeName, created: !exists }, 'Volume restored');

    return { volumeName, created: !exists, sizeBytes: archive.length };
}
