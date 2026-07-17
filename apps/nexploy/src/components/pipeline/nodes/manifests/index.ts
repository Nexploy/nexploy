import { type NodeManifest } from '../../types/nodeManifest';
import { cloneRepositoryManifest } from './clone-repository.manifest';
import { webhookCloneManifest } from './webhook-clone.manifest';
import { validateDockerfileManifest } from './validate-dockerfile.manifest';
import { validateComposeManifest } from './validate-compose.manifest';
import { buildDockerImageManifest } from './build-docker-image.manifest';
import { pushToRegistryManifest } from './push-to-registry.manifest';
import { pullFromRegistryManifest } from './pull-from-registry.manifest';
import { setEnvironmentManifest } from './set-environment.manifest';
import { deployComposeManifest } from './deploy-compose.manifest';
import { setEnvVarsManifest } from './set-env-vars.manifest';
import { cleanWorkdirManifest } from './clean-workdir.manifest';
import { sendNotificationManifest } from './send-notification.manifest';
import { saveVersionManifest } from './save-version.manifest';
import { startContainerManifest } from './start-container.manifest';
import { stopContainerManifest } from './stop-container.manifest';
import { restartContainerManifest } from './restart-container.manifest';
import { removeContainerManifest } from './remove-container.manifest';
import { deleteContainerManifest } from './delete-container.manifest';
import { createContainerManifest } from './create-container.manifest';
import { createNetworkManifest } from './create-network.manifest';
import { createVolumeManifest } from './create-volume.manifest';
import { waitForHealthManifest } from './wait-for-health.manifest';
import { waitForUrlManifest } from './wait-for-url.manifest';
import { waitForPortManifest } from './wait-for-port.manifest';
import { delayManifest } from './delay.manifest';
import { conditionManifest } from './condition.manifest';
import { runCommandInContainerManifest } from './run-command-in-container.manifest';
import { httpRequestManifest } from './http-request.manifest';
import { updateCommitStatusManifest } from './update-commit-status.manifest';
import { tagImageManifest } from './tag-image.manifest';
import { scanImageManifest } from './scan-image.manifest';
import { pruneImagesManifest } from './prune-images.manifest';
import { pruneBuildCacheManifest } from './prune-build-cache.manifest';
import { downloadFileManifest } from './download-file.manifest';
import { backupVolumeBucketStorageManifest } from './backup-volume-bucket-storage.manifest';
import { createServiceManifest } from './create-service.manifest';
import { updateServiceManifest } from './update-service.manifest';
import { scaleServiceManifest } from './scale-service.manifest';
import { checkContainerLogsManifest } from './check-container-logs.manifest';
import { cacheRestoreManifest } from './cache-restore.manifest';
import { cacheSaveManifest } from './cache-save.manifest';
import { gitTagManifest } from './git-tag.manifest';
import { gitCloneExtraManifest } from './git-clone-extra.manifest';
import { fetchSecretsVaultManifest } from './fetch-secrets-vault.manifest';
import { fetchSecretsDopplerManifest } from './fetch-secrets-doppler.manifest';
import { sonarqubeScanManifest } from './sonarqube-scan.manifest';
import { createReleaseManifest } from './create-release.manifest';
import { cherryPickCommitManifest } from './cherry-pick-commit.manifest';
import { mergeBranchManifest } from './merge-branch.manifest';
import { deleteImageManifest } from './delete-image.manifest';
import { deleteNetworkManifest } from './delete-network.manifest';
import { deleteVolumeManifest } from './delete-volume.manifest';
import { addDomainManifest } from './add-domain.manifest';
import { removeDomainManifest } from './remove-domain.manifest';
import { addSslCertificateManifest } from './add-ssl-certificate.manifest';
import { triggerStageBuildManifest } from './trigger-stage-build.manifest';

export const allBuiltinManifests: NodeManifest[] = [
    // Source
    cloneRepositoryManifest,
    webhookCloneManifest,
    // Build
    validateDockerfileManifest,
    validateComposeManifest,
    buildDockerImageManifest,
    pushToRegistryManifest,
    pullFromRegistryManifest,
    // Deploy
    setEnvironmentManifest,
    deployComposeManifest,
    // Utility
    setEnvVarsManifest,
    cleanWorkdirManifest,
    // Notification
    sendNotificationManifest,
    // Versioning
    saveVersionManifest,
    // Docker Actions
    createContainerManifest,
    startContainerManifest,
    stopContainerManifest,
    restartContainerManifest,
    removeContainerManifest,
    deleteContainerManifest,
    createNetworkManifest,
    createVolumeManifest,
    // Flow Control
    waitForHealthManifest,
    waitForUrlManifest,
    waitForPortManifest,
    delayManifest,
    conditionManifest,
    // Script Execution
    runCommandInContainerManifest,
    // HTTP / Webhooks
    httpRequestManifest,
    updateCommitStatusManifest,
    // Image Management
    tagImageManifest,
    scanImageManifest,
    pruneImagesManifest,
    pruneBuildCacheManifest,
    deleteImageManifest,
    deleteNetworkManifest,
    deleteVolumeManifest,
    // Files & Artifacts
    downloadFileManifest,
    // Database
    backupVolumeBucketStorageManifest,
    // Docker Swarm
    createServiceManifest,
    updateServiceManifest,
    scaleServiceManifest,
    // Monitoring
    checkContainerLogsManifest,
    // Cache
    cacheRestoreManifest,
    cacheSaveManifest,
    // Git
    gitTagManifest,
    gitCloneExtraManifest,
    createReleaseManifest,
    cherryPickCommitManifest,
    mergeBranchManifest,
    // Secrets
    fetchSecretsVaultManifest,
    fetchSecretsDopplerManifest,
    // Code Quality
    sonarqubeScanManifest,
    // Domain & SSL
    addDomainManifest,
    removeDomainManifest,
    addSslCertificateManifest,
    // Stage Orchestration
    triggerStageBuildManifest,
];
