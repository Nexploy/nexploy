import { logger } from '@/utils/logger';

interface ManagerConstructor<T> {
    new (environmentId: string): T;
}

export interface ManagerSet {
    containers: any;
    images: any;
    volumes: any;
    networks: any;
    events: any;
    swarm: any;
    traefik: any;
    dockerStatus: any;
}

class StateManagerFactory {
    private managerSets: Map<string, ManagerSet> = new Map();
    private managerConstructors: {
        containers?: ManagerConstructor<any>;
        images?: ManagerConstructor<any>;
        volumes?: ManagerConstructor<any>;
        networks?: ManagerConstructor<any>;
        events?: ManagerConstructor<any>;
        swarm?: ManagerConstructor<any>;
        traefik?: ManagerConstructor<any>;
        dockerStatus?: ManagerConstructor<any>;
    } = {};

    registerConstructors(constructors: {
        containers: ManagerConstructor<any>;
        images: ManagerConstructor<any>;
        volumes: ManagerConstructor<any>;
        networks: ManagerConstructor<any>;
        events: ManagerConstructor<any>;
        swarm: ManagerConstructor<any>;
        traefik: ManagerConstructor<any>;
        dockerStatus: ManagerConstructor<any>;
    }) {
        this.managerConstructors = constructors;
    }

    async initializeEnvironment(environmentId: string): Promise<void> {
        if (this.managerSets.has(environmentId)) {
            logger.warn({ environmentId }, 'Managers already initialized for environment');
            return;
        }

        logger.info({ environmentId }, 'Initializing state managers for environment');

        try {
            const dockerStatusManager = new this.managerConstructors.dockerStatus!(environmentId);

            const partialManagers: Partial<ManagerSet> = {
                dockerStatus: dockerStatusManager,
            };
            this.managerSets.set(environmentId, partialManagers as ManagerSet);

            const managers: ManagerSet = {
                dockerStatus: dockerStatusManager,
                containers: new this.managerConstructors.containers!(environmentId),
                images: new this.managerConstructors.images!(environmentId),
                volumes: new this.managerConstructors.volumes!(environmentId),
                networks: new this.managerConstructors.networks!(environmentId),
                events: new this.managerConstructors.events!(environmentId),
                swarm: new this.managerConstructors.swarm!(environmentId),
                traefik: new this.managerConstructors.traefik!(environmentId),
            };

            this.managerSets.set(environmentId, managers);

            const results = await Promise.allSettled([
                managers.dockerStatus.start(),
                managers.containers.start(),
                managers.images.start(),
                managers.volumes.start(),
                managers.networks.start(),
                managers.events.start(),
                managers.swarm.start(),
                managers.traefik.start(),
            ]);

            const failures = results.filter((r) => r.status === 'rejected');
            if (failures.length > 0) {
                logger.warn(
                    { environmentId, failureCount: failures.length },
                    'Some managers failed to start',
                );
                failures.forEach((failure, index) => {
                    if (failure.status === 'rejected') {
                        logger.error(
                            { environmentId, error: failure.reason },
                            `Manager ${index} failed to start`,
                        );
                    }
                });
            }

            logger.info(
                { environmentId, successCount: results.length - failures.length },
                'State managers initialized for environment',
            );
        } catch (err) {
            logger.error({ err, environmentId }, 'Failed to initialize environment');
            this.managerSets.delete(environmentId);
        }
    }

    getManagers(environmentId: string): ManagerSet {
        const managers = this.managerSets.get(environmentId);
        if (!managers) {
            throw new Error(
                `No managers initialized for environment: ${environmentId}. The environment may have failed to initialize or the Docker daemon may be unreachable.`,
            );
        }
        return managers;
    }

    hasManagers(environmentId: string): boolean {
        return this.managerSets.has(environmentId);
    }

    getManagersSafe(environmentId: string): ManagerSet | null {
        return this.managerSets.get(environmentId) || null;
    }

    async shutdownEnvironment(environmentId: string): Promise<void> {
        const managers = this.managerSets.get(environmentId);
        if (!managers) {
            return;
        }

        logger.info({ environmentId }, 'Shutting down state managers for environment');

        const results = await Promise.allSettled([
            managers.containers.stop(),
            managers.images.stop(),
            managers.volumes.stop(),
            managers.networks.stop(),
            managers.events.stop(),
            managers.swarm.stop(),
            managers.traefik.stop(),
            managers.dockerStatus.stop(),
        ]);

        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
            logger.warn(
                { environmentId, failureCount: failures.length },
                'Some managers failed to stop cleanly',
            );
        }

        this.managerSets.delete(environmentId);
        logger.info({ environmentId }, 'Environment shutdown complete');
    }

    getActiveEnvironments(): string[] {
        return Array.from(this.managerSets.keys());
    }

    async shutdownAll(): Promise<void> {
        const environments = this.getActiveEnvironments();
        await Promise.all(environments.map((envId) => this.shutdownEnvironment(envId)));
    }
}

export const stateManagerFactory = new StateManagerFactory();
