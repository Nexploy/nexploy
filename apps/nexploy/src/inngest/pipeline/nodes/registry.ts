import { INodeExecutor } from '@/types/pipeline.type';
import { cloneRepositoryExecutor } from './executors/clone-repository.executor';
import { writeEnvFileExecutor } from './executors/write-env-file.executor';
import { buildDockerImageExecutor } from './executors/build-docker-image.executor';
import { deployContainerExecutor } from './executors/deploy-container.executor';
import { deployComposeExecutor } from './executors/deploy-compose.executor';
import { pushToRegistryExecutor } from './executors/push-to-registry.executor';
import { validateDockerfileExecutor } from './executors/validate-dockerfile.executor';
import { validateComposeExecutor } from './executors/validate-compose.executor';
import { setEnvVarsExecutor } from './executors/set-env-vars.executor';
import { cleanWorkdirExecutor } from './executors/clean-workdir.executor';
import { runScriptExecutor } from './executors/run-script.executor';
import { sendNotificationExecutor } from './executors/send-notification.executor';

const executors: INodeExecutor[] = [
    // Source
    cloneRepositoryExecutor,
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
    runScriptExecutor,
    // Notification
    sendNotificationExecutor,
];

const executorRegistry = new Map(executors.map((e) => [e.type, e]));

export function getNodeExecutor(type: string): INodeExecutor | undefined {
    return executorRegistry.get(type);
}

export function registerNodeExecutor(executor: INodeExecutor): void {
    executorRegistry.set(executor.type, executor);
}
