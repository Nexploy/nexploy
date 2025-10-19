import { containerStateManager } from '@/services/containerStateManager';
import { logger } from './logger';

export const setupGracefulShutdown = () => {
    const gracefulShutdown = async (signal: string) => {
        logger.info({ signal }, 'Received shutdown signal');

        try {
            await containerStateManager.stop();
            logger.info('Container state manager stopped');
            process.exit(0);
        } catch (err) {
            logger.error({ err }, 'Error during shutdown');
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};
