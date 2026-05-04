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
import { envVarsManifest } from './env-vars.manifest';
import { setEnvVarsManifest } from './set-env-vars.manifest';
import { cleanWorkdirManifest } from './clean-workdir.manifest';
import { sendNotificationManifest } from './send-notification.manifest';
import { saveVersionManifest } from './save-version.manifest';
import { startContainerManifest } from './start-container.manifest';
import { stopContainerManifest } from './stop-container.manifest';
import { restartContainerManifest } from './restart-container.manifest';
import { removeContainerManifest } from './remove-container.manifest';
import { createContainerManifest } from './create-container.manifest';
import { createNetworkManifest } from './create-network.manifest';
import { createVolumeManifest } from './create-volume.manifest';
import { waitForHealthManifest } from './wait-for-health.manifest';
import { waitForUrlManifest } from './wait-for-url.manifest';
import { waitForPortManifest } from './wait-for-port.manifest';
import { delayManifest } from './delay.manifest';
import { conditionManifest } from './condition.manifest';
import { runScriptManifest } from './run-script.manifest';
import { runCommandInContainerManifest } from './run-command-in-container.manifest';
import { runTestsManifest } from './run-tests.manifest';
import { httpRequestManifest } from './http-request.manifest';
import { updateCommitStatusManifest } from './update-commit-status.manifest';
import { tagImageManifest } from './tag-image.manifest';
import { scanImageManifest } from './scan-image.manifest';
import { pruneImagesManifest } from './prune-images.manifest';
import { templateFileManifest } from './template-file.manifest';
import { uploadArtifactManifest } from './upload-artifact.manifest';
import { downloadFileManifest } from './download-file.manifest';
import { runMigrationManifest } from './run-migration.manifest';
import { backupVolumeS3Manifest } from './backup-volume-s3.manifest';
import { updateServiceManifest } from './update-service.manifest';
import { scaleServiceManifest } from './scale-service.manifest';
import { checkContainerLogsManifest } from './check-container-logs.manifest';
import { cacheRestoreManifest } from './cache-restore.manifest';
import { cacheSaveManifest } from './cache-save.manifest';
import { gitTagManifest } from './git-tag.manifest';
import { gitCloneExtraManifest } from './git-clone-extra.manifest';
import { fetchSecretsManifest } from './fetch-secrets.manifest';
import { sonarqubeScanManifest } from './sonarqube-scan.manifest';
import { createReleaseManifest } from './create-release.manifest';
import { cherryPickCommitManifest } from './cherry-pick-commit.manifest';
import { mergeBranchManifest } from './merge-branch.manifest';
import { generateChangelogManifest } from './generate-changelog.manifest';
import { deleteImageManifest } from './delete-image.manifest';
import { deleteNetworkManifest } from './delete-network.manifest';
import { deleteVolumeManifest } from './delete-volume.manifest';

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
    envVarsManifest,
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
    createNetworkManifest,
    createVolumeManifest,
    // Flow Control
    waitForHealthManifest,
    waitForUrlManifest,
    waitForPortManifest,
    delayManifest,
    conditionManifest,
    // Script Execution
    runScriptManifest,
    runCommandInContainerManifest,
    runTestsManifest,
    // HTTP / Webhooks
    httpRequestManifest,
    updateCommitStatusManifest,
    // Image Management
    tagImageManifest,
    scanImageManifest,
    pruneImagesManifest,
    deleteImageManifest,
    deleteNetworkManifest,
    deleteVolumeManifest,
    // Files & Artifacts
    templateFileManifest,
    uploadArtifactManifest,
    downloadFileManifest,
    // Database
    runMigrationManifest,
    backupVolumeS3Manifest,
    // Docker Swarm
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
    generateChangelogManifest,
    // Secrets
    fetchSecretsManifest,
    // Code Quality
    sonarqubeScanManifest,
];
