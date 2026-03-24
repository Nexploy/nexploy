import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { cloneRepositoryNodeDef } from './nodes/definitions/clone-repository.node';
import { webhookCloneNodeDef } from './nodes/definitions/webhook-clone.node';
import { buildDockerImageNodeDef } from './nodes/definitions/build-docker-image.node';
import { deployContainerNodeDef } from './nodes/definitions/deploy-container.node';
import { deployComposeNodeDef } from './nodes/definitions/deploy-compose.node';
import { pushToRegistryNodeDef } from './nodes/definitions/push-to-registry.node';
import { validateDockerfileNodeDef } from './nodes/definitions/validate-dockerfile.node';
import { validateComposeNodeDef } from './nodes/definitions/validate-compose.node';
import { writeEnvFileNodeDef } from './nodes/definitions/write-env-file.node';
import { setEnvVarsNodeDef } from './nodes/definitions/set-env-vars.node';
import { cleanWorkdirNodeDef } from './nodes/definitions/clean-workdir.node';
import { sendNotificationNodeDef } from './nodes/definitions/send-notification.node';
import { saveVersionNodeDef } from './nodes/definitions/save-version.node';
import { setEnvironmentNodeDef } from './nodes/definitions/set-environment.node';

export const ALL_NODE_DEFINITIONS: NodeDefinition[] = [
    // Source
    cloneRepositoryNodeDef,
    webhookCloneNodeDef,
    // Build
    validateDockerfileNodeDef,
    validateComposeNodeDef,
    buildDockerImageNodeDef,
    pushToRegistryNodeDef,
    // Deploy
    setEnvironmentNodeDef,
    deployContainerNodeDef,
    deployComposeNodeDef,
    // Utility
    writeEnvFileNodeDef,
    setEnvVarsNodeDef,
    cleanWorkdirNodeDef,
    // Notification
    sendNotificationNodeDef,
    // Versioning
    saveVersionNodeDef,
];

const nodeRegistry = new Map<string, NodeDefinition>(
    ALL_NODE_DEFINITIONS.map((d) => [d.id, d]),
);

export function getNodeDefinition(type: string): NodeDefinition | undefined {
    return nodeRegistry.get(type);
}
