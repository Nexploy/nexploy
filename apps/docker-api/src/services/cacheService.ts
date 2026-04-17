import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';

const CACHE_IMAGE = 'alpine';

async function ensureImage(): Promise<void> {
    try {
        await docker.getImage(CACHE_IMAGE).inspect();
    } catch {
        logger.info({ image: CACHE_IMAGE }, 'Pulling alpine image for cache operations...');
        await new Promise<void>((resolve, reject) => {
            docker.pull(CACHE_IMAGE, (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err: Error | null) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }
}

function parseDockerLogs(buffer: Buffer): string {
    let output = '';
    let offset = 0;
    while (offset + 8 <= buffer.length) {
        const size = buffer.readUInt32BE(offset + 4);
        if (offset + 8 + size > buffer.length) break;
        output += buffer.slice(offset + 8, offset + 8 + size).toString('utf8');
        offset += 8 + size;
    }
    return output.trim();
}

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
): Promise<{ restored: boolean; files?: number }> {
    await ensureImage();

    const key = cacheKey || 'default';
    const srcPath = `/cache/${key}/${cachePath}`;
    const destPath = `/workdir/${cachePath}`;
    const destParent = destPath.substring(0, destPath.lastIndexOf('/'));

    const script = [
        `src="${srcPath}"`,
        `if [ -e "$src" ]; then`,
        `  mkdir -p "${destParent || '/workdir'}"`,
        `  rm -rf "${destPath}"`,
        `  cp -a "$src" "${destPath}"`,
        `  find "${destPath}" -type f | wc -l | tr -d ' \\n'`,
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

    const files = parseInt(stdout, 10) || 0;
    logger.info({ volumeName, cachePath, key, files }, 'Cache restored');
    return { restored: true, files };
}

export async function saveCache(
    volumeName: string,
    sourcePath: string,
    workDir: string,
    cacheKey?: string,
): Promise<{ saved: boolean; files?: number; sizeBytes?: number }> {
    await ensureImage();

    const key = cacheKey || 'default';
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
