import { INodeExecutor } from '@workspace/pipeline-core/pipeline';
import { addDomainExecutor } from '../add-domain/executor';
import { addSslCertificateExecutor } from '../add-ssl-certificate/executor';
import { backupVolumeBucketStorageExecutor } from '../backup-volume-bucket-storage/executor';
import { buildDockerImageExecutor } from '../build-docker-image/executor';
import { cacheRestoreExecutor } from '../cache-restore/executor';
import { cacheSaveExecutor } from '../cache-save/executor';
import { checkContainerLogsExecutor } from '../check-container-logs/executor';
import { cherryPickCommitExecutor } from '../cherry-pick-commit/executor';
import { cleanWorkdirExecutor } from '../clean-workdir/executor';
import { cloneRepositoryExecutor } from '../clone-repository/executor';
import { composeBuildExecutor } from '../compose-build/executor';
import { composeRunExecutor } from '../compose-run/executor';
import { composeUpExecutor } from '../compose-up/executor';
import { conditionExecutor } from '../condition/executor';
import { createContainerExecutor } from '../create-container/executor';
import { createNetworkExecutor } from '../create-network/executor';
import { createReleaseExecutor } from '../create-release/executor';
import { createServiceExecutor } from '../create-service/executor';
import { createVolumeExecutor } from '../create-volume/executor';
import { delayExecutor } from '../delay/executor';
import { deleteContainerExecutor } from '../delete-container/executor';
import { deleteImageExecutor } from '../delete-image/executor';
import { deleteNetworkExecutor } from '../delete-network/executor';
import { deleteVolumeExecutor } from '../delete-volume/executor';
import { deployComposeExecutor } from '../deploy-compose/executor';
import { downloadFileExecutor } from '../download-file/executor';
import { fetchSecretsDopplerExecutor } from '../fetch-secrets-doppler/executor';
import { fetchSecretsInfisicalExecutor } from '../fetch-secrets-infisical/executor';
import { fetchSecretsVaultExecutor } from '../fetch-secrets-vault/executor';
import { gitCloneExtraExecutor } from '../git-clone-extra/executor';
import { gitTagExecutor } from '../git-tag/executor';
import { httpRequestExecutor } from '../http-request/executor';
import { mergeBranchExecutor } from '../merge-branch/executor';
import { pruneBuildCacheExecutor } from '../prune-build-cache/executor';
import { pruneContainersExecutor } from '../prune-containers/executor';
import { pruneImagesExecutor } from '../prune-images/executor';
import { pruneVolumesExecutor } from '../prune-volumes/executor';
import { pullFromRegistryExecutor } from '../pull-from-registry/executor';
import { pushToRegistryExecutor } from '../push-to-registry/executor';
import { removeContainerExecutor } from '../remove-container/executor';
import { removeDomainExecutor } from '../remove-domain/executor';
import { restartContainerExecutor } from '../restart-container/executor';
import { runCommandInContainerExecutor } from '../run-command-in-container/executor';
import { saveVersionExecutor } from '../save-version/executor';
import { scaleServiceExecutor } from '../scale-service/executor';
import { scanImageExecutor } from '../scan-image/executor';
import { sendNotificationExecutor } from '../send-notification/executor';
import { setEnvVarsExecutor } from '../set-env-vars/executor';
import { setEnvironmentExecutor } from '../set-environment/executor';
import { sonarqubeScanExecutor } from '../sonarqube-scan/executor';
import { startContainerExecutor } from '../start-container/executor';
import { stopContainerExecutor } from '../stop-container/executor';
import { tagImageExecutor } from '../tag-image/executor';
import { triggerStageBuildExecutor } from '../trigger-stage-build/executor';
import { updateCommitStatusExecutor } from '../update-commit-status/executor';
import { updateServiceExecutor } from '../update-service/executor';
import { validateComposeExecutor } from '../validate-compose/executor';
import { validateDockerfileExecutor } from '../validate-dockerfile/executor';
import { waitForHealthExecutor } from '../wait-for-health/executor';
import { waitForPortExecutor } from '../wait-for-port/executor';
import { waitForUrlExecutor } from '../wait-for-url/executor';
import { webhookCloneExecutor } from '../webhook-clone/executor';

const executors: INodeExecutor[] = [
    addDomainExecutor,
    addSslCertificateExecutor,
    backupVolumeBucketStorageExecutor,
    buildDockerImageExecutor,
    cacheRestoreExecutor,
    cacheSaveExecutor,
    checkContainerLogsExecutor,
    cherryPickCommitExecutor,
    cleanWorkdirExecutor,
    cloneRepositoryExecutor,
    composeBuildExecutor,
    composeRunExecutor,
    composeUpExecutor,
    conditionExecutor,
    createContainerExecutor,
    createNetworkExecutor,
    createReleaseExecutor,
    createServiceExecutor,
    createVolumeExecutor,
    delayExecutor,
    deleteContainerExecutor,
    deleteImageExecutor,
    deleteNetworkExecutor,
    deleteVolumeExecutor,
    deployComposeExecutor,
    downloadFileExecutor,
    fetchSecretsDopplerExecutor,
    fetchSecretsInfisicalExecutor,
    fetchSecretsVaultExecutor,
    gitCloneExtraExecutor,
    gitTagExecutor,
    httpRequestExecutor,
    mergeBranchExecutor,
    pruneBuildCacheExecutor,
    pruneContainersExecutor,
    pruneImagesExecutor,
    pruneVolumesExecutor,
    pullFromRegistryExecutor,
    pushToRegistryExecutor,
    removeContainerExecutor,
    removeDomainExecutor,
    restartContainerExecutor,
    runCommandInContainerExecutor,
    saveVersionExecutor,
    scaleServiceExecutor,
    scanImageExecutor,
    sendNotificationExecutor,
    setEnvVarsExecutor,
    setEnvironmentExecutor,
    sonarqubeScanExecutor,
    startContainerExecutor,
    stopContainerExecutor,
    tagImageExecutor,
    triggerStageBuildExecutor,
    updateCommitStatusExecutor,
    updateServiceExecutor,
    validateComposeExecutor,
    validateDockerfileExecutor,
    waitForHealthExecutor,
    waitForPortExecutor,
    waitForUrlExecutor,
    webhookCloneExecutor,
];

const executorRegistry = new Map(executors.map((e) => [e.type, e]));

export function getNodeExecutor(type: string): INodeExecutor | undefined {
    return executorRegistry.get(type);
}

export function registerNodeExecutor(executor: INodeExecutor): void {
    executorRegistry.set(executor.type, executor);
}
