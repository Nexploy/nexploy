import { INodeExecutor } from '@/types/pipeline.type';
import { cloneRepositoryExecutor } from './executors/clone-repository.executor';
import { webhookCloneExecutor } from './executors/webhook-clone.executor';
import { writeEnvFileExecutor } from './executors/write-env-file.executor';
import { buildDockerImageExecutor } from './executors/build-docker-image.executor';
import { deployContainerExecutor } from './executors/deploy-container.executor';
import { deployComposeExecutor } from './executors/deploy-compose.executor';
import { pushToRegistryExecutor } from './executors/push-to-registry.executor';
import { validateDockerfileExecutor } from './executors/validate-dockerfile.executor';
import { validateComposeExecutor } from './executors/validate-compose.executor';
import { setEnvVarsExecutor } from './executors/set-env-vars.executor';
import { cleanWorkdirExecutor } from './executors/clean-workdir.executor';
import { sendNotificationExecutor } from './executors/send-notification.executor';
import { saveVersionExecutor } from './executors/save-version.executor';
import { setEnvironmentExecutor } from './executors/set-environment.executor';
import { startContainerExecutor } from './executors/start-container.executor';
import { stopContainerExecutor } from './executors/stop-container.executor';
import { restartContainerExecutor } from './executors/restart-container.executor';
import { removeContainerExecutor } from './executors/remove-container.executor';
import { pullImageExecutor } from './executors/pull-image.executor';
import { createNetworkExecutor } from './executors/create-network.executor';
import { createVolumeExecutor } from './executors/create-volume.executor';

const executors: INodeExecutor[] = [
    // Source
    cloneRepositoryExecutor,
    webhookCloneExecutor,
    // Build
    validateDockerfileExecutor,
    validateComposeExecutor,
    buildDockerImageExecutor,
    pushToRegistryExecutor,
    // Deploy
    deployContainerExecutor,
    deployComposeExecutor,
    // Utility
    writeEnvFileExecutor,
    setEnvVarsExecutor,
    cleanWorkdirExecutor,
    // Notification
    sendNotificationExecutor,
    // Deploy
    setEnvironmentExecutor,
    // Versioning
    saveVersionExecutor,
    // Docker Actions
    startContainerExecutor,
    stopContainerExecutor,
    restartContainerExecutor,
    removeContainerExecutor,
    pullImageExecutor,
    createNetworkExecutor,
    createVolumeExecutor,
];

const executorRegistry = new Map(executors.map((e) => [e.type, e]));

export function getNodeExecutor(type: string): INodeExecutor | undefined {
    return executorRegistry.get(type);
}

export function registerNodeExecutor(executor: INodeExecutor): void {
    executorRegistry.set(executor.type, executor);
}
