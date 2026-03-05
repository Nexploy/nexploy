import { registerNode } from '@/lib/pipeline/nodeRegistry';
import { cloneRepositoryNodeDef } from './clone-repository.node';
import { buildDockerImageNodeDef } from './build-docker-image.node';
import { deployContainerNodeDef } from './deploy-container.node';
import { writeEnvFileNodeDef } from './write-env-file.node';
import { runScriptNodeDef } from './run-script.node';
import { sendNotificationNodeDef } from './send-notification.node';

export function registerAllNodes(): void {
    registerNode(cloneRepositoryNodeDef);
    registerNode(buildDockerImageNodeDef);
    registerNode(deployContainerNodeDef);
    registerNode(writeEnvFileNodeDef);
    registerNode(runScriptNodeDef);
    registerNode(sendNotificationNodeDef);
}

export {
    cloneRepositoryNodeDef,
    buildDockerImageNodeDef,
    deployContainerNodeDef,
    writeEnvFileNodeDef,
    runScriptNodeDef,
    sendNotificationNodeDef,
};
