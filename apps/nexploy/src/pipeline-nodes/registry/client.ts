import { type ComponentType } from 'react';
import { Position } from '@xyflow/react';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { type HandlePosition, type NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { type NodeManifest } from '@/components/pipeline/types/nodeManifest';
import { CATEGORY_BG_MUTED, CATEGORY_TEXT, ICON_NAME_MAP } from '@/components/pipeline/pipelineTheme';
import { ALL_NODE_DESCRIPTORS, getNodeOutputFields } from './descriptors';
import { webhookCloneLifecycle } from '../webhook-clone/lifecycle';
import { AddDomainConfig } from '../add-domain/Config';
import { AddSslCertificateConfig } from '../add-ssl-certificate/Config';
import { BackupVolumeBucketStorageConfig } from '../backup-volume-bucket-storage/Config';
import { BuildDockerImageConfig } from '../build-docker-image/Config';
import { CacheRestoreConfig } from '../cache-restore/Config';
import { CacheSaveConfig } from '../cache-save/Config';
import { CheckContainerLogsConfig } from '../check-container-logs/Config';
import { CherryPickCommitConfig } from '../cherry-pick-commit/Config';
import { CleanWorkdirConfig } from '../clean-workdir/Config';
import { CloneRepositoryConfig } from '../clone-repository/Config';
import { ComposeBuildConfig } from '../compose-build/Config';
import { ComposeRunConfig } from '../compose-run/Config';
import { ComposeUpConfig } from '../compose-up/Config';
import { ConditionConfig } from '../condition/Config';
import { CreateContainerConfig } from '../create-container/Config';
import { CreateNetworkConfig } from '../create-network/Config';
import { CreateReleaseConfig } from '../create-release/Config';
import { CreateServiceConfig } from '../create-service/Config';
import { CreateVolumeConfig } from '../create-volume/Config';
import { DelayConfig } from '../delay/Config';
import { DeleteContainerConfig } from '../delete-container/Config';
import { DeleteImageConfig } from '../delete-image/Config';
import { DeleteNetworkConfig } from '../delete-network/Config';
import { DeleteVolumeConfig } from '../delete-volume/Config';
import { DeployComposeConfig } from '../deploy-compose/Config';
import { DownloadFileConfig } from '../download-file/Config';
import { FetchSecretsDopplerConfig } from '../fetch-secrets-doppler/Config';
import { FetchSecretsInfisicalConfig } from '../fetch-secrets-infisical/Config';
import { FetchSecretsVaultConfig } from '../fetch-secrets-vault/Config';
import { GitCloneExtraConfig } from '../git-clone-extra/Config';
import { GitTagConfig } from '../git-tag/Config';
import { HttpRequestConfig } from '../http-request/Config';
import { MergeBranchConfig } from '../merge-branch/Config';
import { PruneBuildCacheConfig } from '../prune-build-cache/Config';
import { PruneContainersConfig } from '../prune-containers/Config';
import { PruneImagesConfig } from '../prune-images/Config';
import { PruneVolumesConfig } from '../prune-volumes/Config';
import { PullFromRegistryConfig } from '../pull-from-registry/Config';
import { PushToRegistryConfig } from '../push-to-registry/Config';
import { RemoveContainerConfig } from '../remove-container/Config';
import { RemoveDomainConfig } from '../remove-domain/Config';
import { RestartContainerConfig } from '../restart-container/Config';
import { RunCommandInContainerConfig } from '../run-command-in-container/Config';
import { SaveVersionConfig } from '../save-version/Config';
import { ScaleServiceConfig } from '../scale-service/Config';
import { ScanImageConfig } from '../scan-image/Config';
import { SendNotificationConfig } from '../send-notification/Config';
import { SetEnvVarsConfig } from '../set-env-vars/Config';
import { SetEnvironmentConfig } from '../set-environment/Config';
import { SonarqubeScanConfig } from '../sonarqube-scan/Config';
import { StartContainerConfig } from '../start-container/Config';
import { StopContainerConfig } from '../stop-container/Config';
import { TagImageConfig } from '../tag-image/Config';
import { TriggerStageBuildConfig } from '../trigger-stage-build/Config';
import { UpdateCommitStatusConfig } from '../update-commit-status/Config';
import { UpdateServiceConfig } from '../update-service/Config';
import { ValidateComposeConfig } from '../validate-compose/Config';
import { ValidateDockerfileConfig } from '../validate-dockerfile/Config';
import { WaitForHealthConfig } from '../wait-for-health/Config';
import { WaitForPortConfig } from '../wait-for-port/Config';
import { WaitForUrlConfig } from '../wait-for-url/Config';
import { WebhookCloneConfig } from '../webhook-clone/Config';

const configPanels: Record<string, ComponentType> = {
    'add-domain': AddDomainConfig,
    'add-ssl-certificate': AddSslCertificateConfig,
    'backup-volume-bucket-storage': BackupVolumeBucketStorageConfig,
    'build-docker-image': BuildDockerImageConfig,
    'cache-restore': CacheRestoreConfig,
    'cache-save': CacheSaveConfig,
    'check-container-logs': CheckContainerLogsConfig,
    'cherry-pick-commit': CherryPickCommitConfig,
    'clean-workdir': CleanWorkdirConfig,
    'clone-repository': CloneRepositoryConfig,
    'compose-build': ComposeBuildConfig,
    'compose-run': ComposeRunConfig,
    'compose-up': ComposeUpConfig,
    condition: ConditionConfig,
    'create-container': CreateContainerConfig,
    'create-network': CreateNetworkConfig,
    'create-release': CreateReleaseConfig,
    'create-service': CreateServiceConfig,
    'create-volume': CreateVolumeConfig,
    delay: DelayConfig,
    'delete-container': DeleteContainerConfig,
    'delete-image': DeleteImageConfig,
    'delete-network': DeleteNetworkConfig,
    'delete-volume': DeleteVolumeConfig,
    'deploy-compose': DeployComposeConfig,
    'download-file': DownloadFileConfig,
    'fetch-secrets-doppler': FetchSecretsDopplerConfig,
    'fetch-secrets-infisical': FetchSecretsInfisicalConfig,
    'fetch-secrets-vault': FetchSecretsVaultConfig,
    'git-clone-extra': GitCloneExtraConfig,
    'git-tag': GitTagConfig,
    'http-request': HttpRequestConfig,
    'merge-branch': MergeBranchConfig,
    'prune-build-cache': PruneBuildCacheConfig,
    'prune-containers': PruneContainersConfig,
    'prune-images': PruneImagesConfig,
    'prune-volumes': PruneVolumesConfig,
    'pull-from-registry': PullFromRegistryConfig,
    'push-to-registry': PushToRegistryConfig,
    'remove-container': RemoveContainerConfig,
    'remove-domain': RemoveDomainConfig,
    'restart-container': RestartContainerConfig,
    'run-command-in-container': RunCommandInContainerConfig,
    'save-version': SaveVersionConfig,
    'scale-service': ScaleServiceConfig,
    'scan-image': ScanImageConfig,
    'send-notification': SendNotificationConfig,
    'set-env-vars': SetEnvVarsConfig,
    'set-environment': SetEnvironmentConfig,
    'sonarqube-scan': SonarqubeScanConfig,
    'start-container': StartContainerConfig,
    'stop-container': StopContainerConfig,
    'tag-image': TagImageConfig,
    'trigger-stage-build': TriggerStageBuildConfig,
    'update-commit-status': UpdateCommitStatusConfig,
    'update-service': UpdateServiceConfig,
    'validate-compose': ValidateComposeConfig,
    'validate-dockerfile': ValidateDockerfileConfig,
    'wait-for-health': WaitForHealthConfig,
    'wait-for-port': WaitForPortConfig,
    'wait-for-url': WaitForUrlConfig,
    'webhook-clone': WebhookCloneConfig,
};

const lifecycles = {
    'webhook-clone': webhookCloneLifecycle,
};

const POSITION_MAP: Record<HandlePosition, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

function toDefinition(descriptor: NodeDescriptor): NodeDefinition {
    const mapHandles = (handles: NodeDescriptor['handles']['inputs']) =>
        handles.map((handle) => ({
            ...handle,
            position: POSITION_MAP[handle.position],
        }));

    return {
        id: descriptor.type,
        type: descriptor.nodeType ?? 'base-node',
        category: descriptor.category,
        ...(descriptor.isStartNode && { isStartNode: true }),
        ...(descriptor.isEndNode && { isEndNode: true }),
        metadata: {
            name: `${descriptor.type}.name`,
            description: `${descriptor.type}.description`,
            icon: ICON_NAME_MAP[descriptor.icon],
            color: `${CATEGORY_BG_MUTED[descriptor.category]} ${CATEGORY_TEXT[descriptor.category]}`,
        },
        handles: {
            inputs: mapHandles(descriptor.handles.inputs),
            outputs: mapHandles(descriptor.handles.outputs),
            attachments: mapHandles(descriptor.handles.attachments),
        },
    };
}

function toManifest(descriptor: NodeDescriptor): NodeManifest {
    return {
        type: descriptor.type,
        definition: toDefinition(descriptor),
        configSchema: descriptor.configSchema as NodeManifest['configSchema'],
        configPanel: configPanels[descriptor.type]!,
        lifecycle: lifecycles[descriptor.type as keyof typeof lifecycles],
        inputFields: getNodeOutputFields(descriptor.type),
    };
}

export const allBuiltinManifests: NodeManifest[] = ALL_NODE_DESCRIPTORS.map(toManifest);
