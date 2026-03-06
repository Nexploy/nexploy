import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { cloneRepositoryNodeDef } from './nodes/definitions/clone-repository.node';
import { buildDockerImageNodeDef } from './nodes/definitions/build-docker-image.node';
import { deployContainerNodeDef } from './nodes/definitions/deploy-container.node';
import { writeEnvFileNodeDef } from './nodes/definitions/write-env-file.node';
import { runScriptNodeDef } from './nodes/definitions/run-script.node';
import { sendNotificationNodeDef } from './nodes/definitions/send-notification.node';

export const ALL_NODE_DEFINITIONS: NodeDefinition[] = [
    cloneRepositoryNodeDef,
    buildDockerImageNodeDef,
    deployContainerNodeDef,
    writeEnvFileNodeDef,
    runScriptNodeDef,
    sendNotificationNodeDef,
];

const nodeRegistry = new Map(ALL_NODE_DEFINITIONS.map((d) => [d.type, d]));

export function getNodeDefinition(type: string): NodeDefinition | undefined {
    return nodeRegistry.get(type);
}

export function getAllNodeDefinitions(): NodeDefinition[] {
    return ALL_NODE_DEFINITIONS;
}
