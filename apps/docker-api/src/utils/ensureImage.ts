import type Docker from 'dockerode';
import { logger } from '@/utils/logger';

export async function ensureImage(docker: Docker, image: string): Promise<void> {
    try {
        await docker.getImage(image).inspect();
    } catch {
        logger.info({ image }, `Pulling image ${image}...`);
        await new Promise<void>((resolve, reject) => {
            docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (pullErr: Error | null) => {
                    if (pullErr) return reject(pullErr);
                    resolve();
                });
            });
        });
    }
}
