import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { addDomainDescriptor } from '../add-domain/node';
import { addSslCertificateDescriptor } from '../add-ssl-certificate/node';
import { backupVolumeBucketStorageDescriptor } from '../backup-volume-bucket-storage/node';
import { buildDockerImageDescriptor } from '../build-docker-image/node';
import { cacheRestoreDescriptor } from '../cache-restore/node';
import { cacheSaveDescriptor } from '../cache-save/node';
import { checkContainerLogsDescriptor } from '../check-container-logs/node';
import { cherryPickCommitDescriptor } from '../cherry-pick-commit/node';
import { cleanWorkdirDescriptor } from '../clean-workdir/node';
import { cloneRepositoryDescriptor } from '../clone-repository/node';
import { composeBuildDescriptor } from '../compose-build/node';
import { composeRunDescriptor } from '../compose-run/node';
import { composeUpDescriptor } from '../compose-up/node';
import { conditionDescriptor } from '../condition/node';
import { createContainerDescriptor } from '../create-container/node';
import { createNetworkDescriptor } from '../create-network/node';
import { createReleaseDescriptor } from '../create-release/node';
import { createServiceDescriptor } from '../create-service/node';
import { createVolumeDescriptor } from '../create-volume/node';
import { delayDescriptor } from '../delay/node';
import { deleteContainerDescriptor } from '../delete-container/node';
import { deleteImageDescriptor } from '../delete-image/node';
import { deleteNetworkDescriptor } from '../delete-network/node';
import { deleteVolumeDescriptor } from '../delete-volume/node';
import { deployComposeDescriptor } from '../deploy-compose/node';
import { downloadFileDescriptor } from '../download-file/node';
import { fetchSecretsDopplerDescriptor } from '../fetch-secrets-doppler/node';
import { fetchSecretsInfisicalDescriptor } from '../fetch-secrets-infisical/node';
import { fetchSecretsVaultDescriptor } from '../fetch-secrets-vault/node';
import { gitCloneExtraDescriptor } from '../git-clone-extra/node';
import { gitTagDescriptor } from '../git-tag/node';
import { httpRequestDescriptor } from '../http-request/node';
import { mergeBranchDescriptor } from '../merge-branch/node';
import { pruneBuildCacheDescriptor } from '../prune-build-cache/node';
import { pruneContainersDescriptor } from '../prune-containers/node';
import { pruneImagesDescriptor } from '../prune-images/node';
import { pruneVolumesDescriptor } from '../prune-volumes/node';
import { pullFromRegistryDescriptor } from '../pull-from-registry/node';
import { pushToRegistryDescriptor } from '../push-to-registry/node';
import { removeContainerDescriptor } from '../remove-container/node';
import { removeDomainDescriptor } from '../remove-domain/node';
import { restartContainerDescriptor } from '../restart-container/node';
import { runCommandInContainerDescriptor } from '../run-command-in-container/node';
import { saveVersionDescriptor } from '../save-version/node';
import { scaleServiceDescriptor } from '../scale-service/node';
import { scanImageDescriptor } from '../scan-image/node';
import { sendNotificationDescriptor } from '../send-notification/node';
import { setEnvVarsDescriptor } from '../set-env-vars/node';
import { setEnvironmentDescriptor } from '../set-environment/node';
import { sonarqubeScanDescriptor } from '../sonarqube-scan/node';
import { startContainerDescriptor } from '../start-container/node';
import { stopContainerDescriptor } from '../stop-container/node';
import { tagImageDescriptor } from '../tag-image/node';
import { triggerStageBuildDescriptor } from '../trigger-stage-build/node';
import { updateCommitStatusDescriptor } from '../update-commit-status/node';
import { updateServiceDescriptor } from '../update-service/node';
import { validateComposeDescriptor } from '../validate-compose/node';
import { validateDockerfileDescriptor } from '../validate-dockerfile/node';
import { waitForHealthDescriptor } from '../wait-for-health/node';
import { waitForPortDescriptor } from '../wait-for-port/node';
import { waitForUrlDescriptor } from '../wait-for-url/node';
import { webhookCloneDescriptor } from '../webhook-clone/node';

export const ALL_NODE_DESCRIPTORS: NodeDescriptor[] = [
    addDomainDescriptor,
    addSslCertificateDescriptor,
    backupVolumeBucketStorageDescriptor,
    buildDockerImageDescriptor,
    cacheRestoreDescriptor,
    cacheSaveDescriptor,
    checkContainerLogsDescriptor,
    cherryPickCommitDescriptor,
    cleanWorkdirDescriptor,
    cloneRepositoryDescriptor,
    composeBuildDescriptor,
    composeRunDescriptor,
    composeUpDescriptor,
    conditionDescriptor,
    createContainerDescriptor,
    createNetworkDescriptor,
    createReleaseDescriptor,
    createServiceDescriptor,
    createVolumeDescriptor,
    delayDescriptor,
    deleteContainerDescriptor,
    deleteImageDescriptor,
    deleteNetworkDescriptor,
    deleteVolumeDescriptor,
    deployComposeDescriptor,
    downloadFileDescriptor,
    fetchSecretsDopplerDescriptor,
    fetchSecretsInfisicalDescriptor,
    fetchSecretsVaultDescriptor,
    gitCloneExtraDescriptor,
    gitTagDescriptor,
    httpRequestDescriptor,
    mergeBranchDescriptor,
    pruneBuildCacheDescriptor,
    pruneContainersDescriptor,
    pruneImagesDescriptor,
    pruneVolumesDescriptor,
    pullFromRegistryDescriptor,
    pushToRegistryDescriptor,
    removeContainerDescriptor,
    removeDomainDescriptor,
    restartContainerDescriptor,
    runCommandInContainerDescriptor,
    saveVersionDescriptor,
    scaleServiceDescriptor,
    scanImageDescriptor,
    sendNotificationDescriptor,
    setEnvVarsDescriptor,
    setEnvironmentDescriptor,
    sonarqubeScanDescriptor,
    startContainerDescriptor,
    stopContainerDescriptor,
    tagImageDescriptor,
    triggerStageBuildDescriptor,
    updateCommitStatusDescriptor,
    updateServiceDescriptor,
    validateComposeDescriptor,
    validateDockerfileDescriptor,
    waitForHealthDescriptor,
    waitForPortDescriptor,
    waitForUrlDescriptor,
    webhookCloneDescriptor,
];

const descriptorsByType = new Map(ALL_NODE_DESCRIPTORS.map((d) => [d.type as string, d]));

export function getNodeDescriptor(type: string): NodeDescriptor | undefined {
    return descriptorsByType.get(type);
}

export interface NodeOutputFieldView {
    key: string;
    labelKey: string;
    descriptionKey: string;
    type: 'input' | 'number' | 'array';
}

export function getNodeOutputFields(type: string): NodeOutputFieldView[] | undefined {
    const outputs = descriptorsByType.get(type)?.outputs?.filter((output) => !output.internal);
    if (!outputs?.length) return undefined;

    return outputs.map((output) => ({
        key: output.key,
        labelKey: output.labelKey ?? `pipeline.inputs.${output.key}`,
        descriptionKey: output.descriptionKey ?? `pipeline.inputs.desc_${output.key}`,
        type: output.type ?? 'input',
    }));
}
