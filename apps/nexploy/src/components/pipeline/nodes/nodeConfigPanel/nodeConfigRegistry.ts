import { type ComponentType } from 'react';
import { type NodeId, NodeLifecycleCallbacks } from '@workspace/typescript-interface/pipeline/node';
import {
    buildDockerImageConfigSchema,
    cleanWorkdirConfigSchema,
    cloneRepositoryConfigSchema,
    composeFileConfigSchema,
    containerActionConfigSchema,
    createNetworkConfigSchema,
    createVolumeConfigSchema,
    deployContainerConfigSchema,
    pullImageConfigSchema,
    pushToRegistryConfigSchema,
    saveVersionConfigSchema,
    sendNotificationConfigSchema,
    setEnvironmentConfigSchema,
    setEnvVarsConfigSchema,
    validateDockerfileConfigSchema,
    webhookCloneConfigSchema,
    writeEnvFileConfigSchema,
} from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { teardownWebhookAction } from '@/actions/repository/pipeline/teardownWebhook.action';
import { CloneRepositoryConfig } from '../config/CloneRepositoryConfig';
import { WebhookCloneConfig } from '../config/WebhookCloneConfig';
import { BuildDockerImageConfig } from '../config/BuildDockerImageConfig';
import { ValidateDockerfileConfig } from '../config/ValidateDockerfileConfig';
import { ValidateComposeConfig } from '../config/ValidateComposeConfig';
import { DeployContainerConfig } from '../config/DeployContainerConfig';
import { DeployComposeConfig } from '../config/DeployComposeConfig';
import { PushToRegistryConfig } from '../config/PushToRegistryConfig';
import { WriteEnvFileConfig } from '../config/WriteEnvFileConfig';
import { SetEnvVarsConfig } from '../config/SetEnvVarsConfig';
import { CleanWorkdirConfig } from '../config/CleanWorkdirConfig';
import { SendNotificationConfig } from '../config/SendNotificationConfig';
import { SaveVersionConfig } from '../config/SaveVersionConfig';
import { SetEnvironmentConfig } from '../config/SetEnvironmentConfig';
import { StartContainerConfig } from '../config/StartContainerConfig';
import { StopContainerConfig } from '../config/StopContainerConfig';
import { RestartContainerConfig } from '../config/RestartContainerConfig';
import { RemoveContainerConfig } from '../config/RemoveContainerConfig';
import { PullImageConfig } from '../config/PullImageConfig';
import { CreateNetworkConfig } from '../config/CreateNetworkConfig';
import { CreateVolumeConfig } from '../config/CreateVolumeConfig';

export const CONFIG_SCHEMAS: Record<NodeId, any> = {
    'clone-repository': cloneRepositoryConfigSchema,
    'webhook-clone': webhookCloneConfigSchema,
    'build-docker-image': buildDockerImageConfigSchema,
    'validate-dockerfile': validateDockerfileConfigSchema,
    'validate-compose': composeFileConfigSchema,
    'deploy-container': deployContainerConfigSchema,
    'deploy-compose': composeFileConfigSchema,
    'push-to-registry': pushToRegistryConfigSchema,
    'write-env-file': writeEnvFileConfigSchema,
    'set-env-vars': setEnvVarsConfigSchema,
    'clean-workdir': cleanWorkdirConfigSchema,
    'send-notification': sendNotificationConfigSchema,
    'save-version': saveVersionConfigSchema,
    'set-environment': setEnvironmentConfigSchema,
    'start-container': containerActionConfigSchema,
    'stop-container': containerActionConfigSchema,
    'restart-container': containerActionConfigSchema,
    'remove-container': containerActionConfigSchema,
    'pull-image': pullImageConfigSchema,
    'create-network': createNetworkConfigSchema,
    'create-volume': createVolumeConfigSchema,
};

export const NODE_LIFECYCLE: Partial<Record<NodeId, NodeLifecycleCallbacks>> = {
    'webhook-clone': {
        onAdd: async (repositoryId) => {
            const result = await setupWebhookAction({ repositoryId });
            if (result?.data && !result.data.configured) {
                return { success: false, error: result.data.error };
            }
            return { success: true };
        },
        onRemove: async (repositoryId, remaining) => {
            if (remaining === 0) {
                await teardownWebhookAction({ repositoryId });
            }
        },
    },
};

export const CONFIG_PANELS: Record<NodeId, ComponentType> = {
    'clone-repository': CloneRepositoryConfig,
    'webhook-clone': WebhookCloneConfig,
    'build-docker-image': BuildDockerImageConfig,
    'validate-dockerfile': ValidateDockerfileConfig,
    'validate-compose': ValidateComposeConfig,
    'deploy-container': DeployContainerConfig,
    'deploy-compose': DeployComposeConfig,
    'push-to-registry': PushToRegistryConfig,
    'write-env-file': WriteEnvFileConfig,
    'set-env-vars': SetEnvVarsConfig,
    'clean-workdir': CleanWorkdirConfig,
    'send-notification': SendNotificationConfig,
    'save-version': SaveVersionConfig,
    'set-environment': SetEnvironmentConfig,
    'start-container': StartContainerConfig,
    'stop-container': StopContainerConfig,
    'restart-container': RestartContainerConfig,
    'remove-container': RemoveContainerConfig,
    'pull-image': PullImageConfig,
    'create-network': CreateNetworkConfig,
    'create-volume': CreateVolumeConfig,
};
