import { logger } from './logger';

let isShuttingDown = false;

export function setupGracefulShutdown(cleanupCallback: () => Promise<void>) {
    const shutdown = async (signal: string) => {
        if (isShuttingDown) {
            logger.warn('Shutdown already in progress, ignoring signal');
            return;
        }

        isShuttingDown = true;
        logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

        try {
            await cleanupCallback();

            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (err) {
            logger.error({ err }, 'Error during graceful shutdown');
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
        logger.error({ err }, 'Uncaught exception');
        shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error({ reason, promise }, 'Unhandled promise rejection');
        shutdown('unhandledRejection');
    });

    logger.info('Graceful shutdown handlers registered');
}
