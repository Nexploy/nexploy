import { type ComponentType } from 'react';
import { type NodeId } from '@workspace/typescript-interface/pipeline/node';
import {
    buildDockerImageConfigSchema,
    cleanWorkdirConfigSchema,
    cloneRepositoryConfigSchema,
    composeFileConfigSchema,
    deployContainerConfigSchema,
    pushToRegistryConfigSchema,
    saveVersionConfigSchema,
    sendNotificationConfigSchema,
    setEnvVarsConfigSchema,
    setEnvironmentConfigSchema,
    validateDockerfileConfigSchema,
    writeEnvFileConfigSchema,
} from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { CloneRepositoryConfig } from '../config/CloneRepositoryConfig';
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

export const CONFIG_SCHEMAS: Record<NodeId, any> = {
    'clone-repository': cloneRepositoryConfigSchema,
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
};

export const CONFIG_PANELS: Record<NodeId, ComponentType> = {
    'clone-repository': CloneRepositoryConfig,
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
};
