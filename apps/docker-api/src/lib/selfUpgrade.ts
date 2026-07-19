import { defaultDocker } from '@/utils/dockerClient';
import { recreateContainerWithImage } from '@/utils/recreateWithImage';
import { logger } from '@/utils/logger';

export async function runSelfUpgradeAndExit(): Promise<void> {
    const targetImage = process.env.SELF_UPGRADE_TARGET_IMAGE;
    const containerName = process.env.SELF_UPGRADE_CONTAINER_NAME;

    if (!targetImage || !containerName) {
        logger.error('Self-upgrade mode started without target image or container name');
        process.exit(1);
    }

    try {
        await recreateContainerWithImage(defaultDocker, containerName, targetImage);
        logger.info({ image: targetImage }, 'docker-api self-upgrade complete');
    } catch (error) {
        logger.error({ error }, 'docker-api self-upgrade failed');
    } finally {
        process.exit(0);
    }
}
