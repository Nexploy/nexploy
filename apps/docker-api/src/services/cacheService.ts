import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { ensureImage } from '@/utils/ensureImage';
import { parseDockerLogs } from '@/utils/parseDockerLogs';
import { safeResolvePath } from '@workspace/shared/pathSafety';

const CACHE_IMAGE = 'alpine';

async function runAlpineCmd(
    cmd: string[],
    binds: string[],
): Promise<{ exitCode: number; stdout: string }> {
    const container = await docker.createContainer({
        Image: CACHE_IMAGE,
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: { Binds: binds, AutoRemove: false },
    });

    try {
        await container.start();
        const waitResult = await container.wait();
        const logBuffer = (await container.logs({ stdout: true, stderr: false })) as Buffer;
        const stdout = parseDockerLogs(logBuffer);
        return { exitCode: waitResult.StatusCode, stdout };
    } finally {
        container.remove({ force: true }).catch(() => {});
    }
}

export async function restoreCache(
    volumeName: string,
    cachePath: string,
    workDir: string,
    cacheKey?: string,
): Promise<{ restored: boolean; sizeBytes?: number }> {
    await ensureImage(docker, CACHE_IMAGE);

    const key = cacheKey || 'default';
    safeResolvePath('/workdir', cachePath);
    const srcPath = `/cache/${key}/${cachePath}`;
    const destPath = `/workdir/${cachePath}`;
    const destParent = destPath.substring(0, destPath.lastIndexOf('/'));

    const script = [
        `src="${srcPath}"`,
        `if [ -e "$src" ]; then`,
        `  mkdir -p "${destParent || '/workdir'}"`,
        `  rm -rf "${destPath}"`,
        `  cp -a "$src" "${destPath}"`,
        `  size=$(du -sk "${destPath}" | cut -f1)`,
        `  echo "$((size * 1024))"`,
        `else`,
        `  echo "NOT_FOUND"`,
        `fi`,
    ].join('\n');

    logger.info({ volumeName, cachePath, key, workDir }, 'Restoring cache');

    const { exitCode, stdout } = await runAlpineCmd(
        ['sh', '-c', script],
        [`${volumeName}:/cache`, `${workDir}:/workdir`],
    );

    if (exitCode !== 0 || stdout === 'NOT_FOUND') {
        logger.info({ volumeName, cachePath, key }, 'No cache found to restore');
        return { restored: false };
    }

    const sizeBytes = parseInt(stdout, 10) || 0;
    logger.info({ volumeName, cachePath, key, sizeBytes }, 'Cache restored');
    return { restored: true, sizeBytes };
}

export async function saveCache(
    volumeName: string,
    sourcePath: string,
    workDir: string,
    cacheKey?: string,
): Promise<{ saved: boolean; files?: number; sizeBytes?: number }> {
    await ensureImage(docker, CACHE_IMAGE);

    const key = cacheKey || 'default';
    safeResolvePath('/workdir', sourcePath);
    const srcPath = `/workdir/${sourcePath}`;
    const destParent = `/cache/${key}`;
    const destPath = `/cache/${key}/${sourcePath}`;

    const script = [
        `src="${srcPath}"`,
        `if [ -e "$src" ]; then`,
        `  mkdir -p "${destParent}"`,
        `  rm -rf "${destPath}"`,
        `  cp -a "$src" "${destPath}"`,
        `  files=$(find "${destPath}" -type f | wc -l | tr -d ' ')`,
        `  size=$(du -sk "${destPath}" | cut -f1)`,
        `  echo "$files $((size * 1024))"`,
        `else`,
        `  echo "NOT_FOUND"`,
        `fi`,
    ].join('\n');

    logger.info({ volumeName, sourcePath, key, workDir }, 'Saving cache');

    const { exitCode, stdout } = await runAlpineCmd(
        ['sh', '-c', script],
        [`${volumeName}:/cache`, `${workDir}:/workdir`],
    );

    if (exitCode !== 0 || stdout === 'NOT_FOUND') {
        logger.warn({ volumeName, sourcePath, key }, 'Source path not found, cache not saved');
        return { saved: false };
    }

    const parts = stdout.trim().split(' ');
    const files = parseInt(parts[0], 10) || 0;
    const sizeBytes = parseInt(parts[1], 10) || 0;

    logger.info({ volumeName, sourcePath, key, files, sizeBytes }, 'Cache saved');
    return { saved: true, files, sizeBytes };
}
