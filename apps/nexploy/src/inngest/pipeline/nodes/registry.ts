import { INodeExecutor } from '@/types/pipeline.type';
import { cloneRepositoryExecutor } from './executors/clone-repository.executor';
import { webhookCloneExecutor } from './executors/webhook-clone.executor';
import { envVarsExecutor } from './executors/env-vars.executor';
import { buildDockerImageExecutor } from './executors/build-docker-image.executor';
import { deployComposeExecutor } from './executors/deploy-compose.executor';
import { pushToRegistryExecutor } from './executors/push-to-registry.executor';
import { pullFromRegistryExecutor } from './executors/pull-from-registry.executor';
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
import { createContainerExecutor } from './executors/create-container.executor';
import { createNetworkExecutor } from './executors/create-network.executor';
import { createVolumeExecutor } from './executors/create-volume.executor';
import { waitForHealthExecutor } from './executors/wait-for-health.executor';
import { waitForUrlExecutor } from './executors/wait-for-url.executor';
import { waitForPortExecutor } from './executors/wait-for-port.executor';
import { delayExecutor } from './executors/delay.executor';
import { conditionExecutor } from './executors/condition.executor';
import { runCommandInContainerExecutor } from './executors/run-command-in-container.executor';
import { httpRequestExecutor } from './executors/http-request.executor';
import { updateCommitStatusExecutor } from './executors/update-commit-status.executor';
import { tagImageExecutor } from './executors/tag-image.executor';
import { scanImageExecutor } from './executors/scan-image.executor';
import { pruneImagesExecutor } from './executors/prune-images.executor';
import { downloadFileExecutor } from './executors/download-file.executor';
import { backupVolumeS3Executor } from './executors/backup-volume-s3.executor';
import { createServiceExecutor } from './executors/create-service.executor';
import { updateServiceExecutor } from './executors/update-service.executor';
import { scaleServiceExecutor } from './executors/scale-service.executor';
import { checkContainerLogsExecutor } from './executors/check-container-logs.executor';
import { cacheRestoreExecutor } from './executors/cache-restore.executor';
import { cacheSaveExecutor } from './executors/cache-save.executor';
import { gitTagExecutor } from './executors/git-tag.executor';
import { gitCloneExtraExecutor } from './executors/git-clone-extra.executor';
import { fetchSecretsVaultExecutor } from './executors/fetch-secrets-vault.executor';
import { fetchSecretsDopplerExecutor } from './executors/fetch-secrets-doppler.executor';
import { sonarqubeScanExecutor } from './executors/sonarqube-scan.executor';
import { createReleaseExecutor } from './executors/create-release.executor';
import { cherryPickCommitExecutor } from './executors/cherry-pick-commit.executor';
import { mergeBranchExecutor } from './executors/merge-branch.executor';
import { deleteImageExecutor } from './executors/delete-image.executor';
import { deleteNetworkExecutor } from './executors/delete-network.executor';
import { deleteVolumeExecutor } from './executors/delete-volume.executor';
import { addDomainExecutor } from './executors/add-domain.executor';
import { addSslCertificateExecutor } from './executors/add-ssl-certificate.executor';

const executors: INodeExecutor[] = [
    // Source
    cloneRepositoryExecutor,
    webhookCloneExecutor,
    // Build
    validateDockerfileExecutor,
    validateComposeExecutor,
    buildDockerImageExecutor,
    pushToRegistryExecutor,
    pullFromRegistryExecutor,
    // Deploy
    deployComposeExecutor,
    // Utility
    envVarsExecutor,
    setEnvVarsExecutor,
    cleanWorkdirExecutor,
    // Notification
    sendNotificationExecutor,
    // Deploy
    setEnvironmentExecutor,
    // Versioning
    saveVersionExecutor,
    // Docker Actions
    createContainerExecutor,
    startContainerExecutor,
    stopContainerExecutor,
    restartContainerExecutor,
    removeContainerExecutor,
    createNetworkExecutor,
    createVolumeExecutor,
    // Flow Control
    waitForHealthExecutor,
    waitForUrlExecutor,
    waitForPortExecutor,
    delayExecutor,
    conditionExecutor,
    // Script Execution
    runCommandInContainerExecutor,
    // HTTP / Webhooks
    httpRequestExecutor,
    updateCommitStatusExecutor,
    // Image Management
    tagImageExecutor,
    scanImageExecutor,
    pruneImagesExecutor,
    deleteImageExecutor,
    deleteNetworkExecutor,
    deleteVolumeExecutor,
    // Files & Artifacts
    downloadFileExecutor,
    // Database
    backupVolumeS3Executor,
    // Docker Swarm
    createServiceExecutor,
    updateServiceExecutor,
    scaleServiceExecutor,
    // Monitoring
    checkContainerLogsExecutor,
    // Cache
    cacheRestoreExecutor,
    cacheSaveExecutor,
    // Git
    gitTagExecutor,
    gitCloneExtraExecutor,
    createReleaseExecutor,
    cherryPickCommitExecutor,
    mergeBranchExecutor,
    // Secrets
    fetchSecretsVaultExecutor,
    fetchSecretsDopplerExecutor,
    // Code Quality
    sonarqubeScanExecutor,
    // Domain & SSL
    addDomainExecutor,
    addSslCertificateExecutor,
];

const executorRegistry = new Map(executors.map((e) => [e.type, e]));

export function getNodeExecutor(type: string): INodeExecutor | undefined {
    return executorRegistry.get(type);
}

export function registerNodeExecutor(executor: INodeExecutor): void {
    executorRegistry.set(executor.type, executor);
}
