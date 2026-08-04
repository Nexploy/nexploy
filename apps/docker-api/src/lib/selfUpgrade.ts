import { defaultDocker } from '@/utils/dockerClient';
import { recreateContainerWithImage } from '@/utils/recreateWithImage';
import { pullImage } from '@/utils/pullImage';
import { waitForContainerHealthy } from '@/utils/wait';
import { logger } from '@/utils/logger';
import { DOCKER_API_NETWORK_ALIAS, NEXPLOY_APP_HEALTHCHECK, NEXPLOY_APP_NETWORK_ALIAS } from '@/lib/config';

const DOCKER_API_READY_TIMEOUT_MS = 60_000;
const APP_READY_TIMEOUT_MS = 180_000;

export async function runSelfUpgradeAndExit(): Promise<void> {
    const dockerApiImage = process.env.SELF_UPGRADE_TARGET_IMAGE;
    const dockerApiContainer = process.env.SELF_UPGRADE_CONTAINER_NAME;
    const appImage = process.env.SELF_UPGRADE_APP_TARGET_IMAGE;
    const appContainer = process.env.SELF_UPGRADE_APP_CONTAINER_NAME;

    if (!dockerApiImage || !dockerApiContainer) {
        logger.error('Upgrader started without a docker-api target image or container name');
        process.exit(1);
    }

    const appTarget = appImage && appContainer ? { image: appImage, container: appContainer } : null;

    if (appTarget) {
        try {
            logger.info({ image: appTarget.image }, 'Pulling the Nexploy image');
            await pullImage(defaultDocker, appTarget.image);
        } catch (error) {
            logger.error({ error, image: appTarget.image }, 'Failed to pull the Nexploy image — nothing was upgraded');
            process.exit(1);
        }
    }

    try {
        logger.info({ container: dockerApiContainer, image: dockerApiImage }, 'Upgrading docker-api');
        await recreateContainerWithImage(defaultDocker, dockerApiContainer, dockerApiImage, {
            aliases: [DOCKER_API_NETWORK_ALIAS],
        });

        const dockerApiReady = await waitForContainerHealthy(
            defaultDocker,
            dockerApiContainer,
            DOCKER_API_READY_TIMEOUT_MS,
        );
        if (!dockerApiReady) {
            logger.warn({ container: dockerApiContainer }, 'docker-api did not report ready in time, continuing');
        }
    } catch (error) {
        logger.error({ error, container: dockerApiContainer }, 'docker-api upgrade failed');
        process.exit(1);
    }

    if (!appTarget) {
        logger.info({ image: dockerApiImage }, 'Upgrade complete (docker-api only)');
        process.exit(0);
    }

    try {
        logger.info({ container: appTarget.container, image: appTarget.image }, 'Upgrading Nexploy');
        await recreateContainerWithImage(defaultDocker, appTarget.container, appTarget.image, {
            aliases: [NEXPLOY_APP_NETWORK_ALIAS],
            healthcheck: NEXPLOY_APP_HEALTHCHECK,
        });

        const appReady = await waitForContainerHealthy(defaultDocker, appTarget.container, APP_READY_TIMEOUT_MS);
        if (!appReady) {
            logger.error(
                { container: appTarget.container },
                'Nexploy did not report healthy in time — the maintenance page may still be served',
            );
            process.exit(1);
        }

        logger.info({ appImage: appTarget.image, dockerApiImage }, 'Upgrade complete');
        process.exit(0);
    } catch (error) {
        logger.error({ error, container: appTarget.container }, 'Nexploy upgrade failed');
        process.exit(1);
    }
}
