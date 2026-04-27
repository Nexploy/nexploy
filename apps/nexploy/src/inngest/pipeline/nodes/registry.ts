import { INodeExecutor } from '@/types/pipeline.type';
import { cloneRepositoryExecutor } from './executors/clone-repository.executor';
import { webhookCloneExecutor } from './executors/webhook-clone.executor';
import { injectEnvVarsExecutor } from './executors/inject-env-vars.executor';
import { buildDockerImageExecutor } from './executors/build-docker-image.executor';
import { deployContainerExecutor } from './executors/deploy-container.executor';
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
import { runScriptExecutor } from './executors/run-script.executor';
import { runCommandInContainerExecutor } from './executors/run-command-in-container.executor';
import { runTestsExecutor } from './executors/run-tests.executor';
import { httpRequestExecutor } from './executors/http-request.executor';
import { updateCommitStatusExecutor } from './executors/update-commit-status.executor';
import { tagImageExecutor } from './executors/tag-image.executor';
import { scanImageExecutor } from './executors/scan-image.executor';
import { pruneImagesExecutor } from './executors/prune-images.executor';
import { templateFileExecutor } from './executors/template-file.executor';
import { uploadArtifactExecutor } from './executors/upload-artifact.executor';
import { downloadFileExecutor } from './executors/download-file.executor';
import { runMigrationExecutor } from './executors/run-migration.executor';
import { backupVolumeS3Executor } from './executors/backup-volume-s3.executor';
import { deployStackExecutor } from './executors/deploy-stack.executor';
import { updateServiceExecutor } from './executors/update-service.executor';
import { scaleServiceExecutor } from './executors/scale-service.executor';
import { checkContainerLogsExecutor } from './executors/check-container-logs.executor';
import { cacheRestoreExecutor } from './executors/cache-restore.executor';
import { cacheSaveExecutor } from './executors/cache-save.executor';
import { gitTagExecutor } from './executors/git-tag.executor';
import { gitCloneExtraExecutor } from './executors/git-clone-extra.executor';
import { fetchSecretsExecutor } from './executors/fetch-secrets.executor';
import { sonarqubeScanExecutor } from './executors/sonarqube-scan.executor';
import { createReleaseExecutor } from './executors/create-release.executor';
import { cherryPickCommitExecutor } from './executors/cherry-pick-commit.executor';
import { mergeBranchExecutor } from './executors/merge-branch.executor';
import { generateChangelogExecutor } from './executors/generate-changelog.executor';
import { deleteImageExecutor } from './executors/delete-image.executor';
import { deleteNetworkExecutor } from './executors/delete-network.executor';
import { deleteVolumeExecutor } from './executors/delete-volume.executor';

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
    deployContainerExecutor,
    deployComposeExecutor,
    // Utility
    injectEnvVarsExecutor,
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
    runScriptExecutor,
    runCommandInContainerExecutor,
    runTestsExecutor,
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
    templateFileExecutor,
    uploadArtifactExecutor,
    downloadFileExecutor,
    // Database
    runMigrationExecutor,
    backupVolumeS3Executor,
    // Docker Swarm
    deployStackExecutor,
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
    generateChangelogExecutor,
    // Secrets
    fetchSecretsExecutor,
    // Code Quality
    sonarqubeScanExecutor,
];

const executorRegistry = new Map(executors.map((e) => [e.type, e]));

export function getNodeExecutor(type: string): INodeExecutor | undefined {
    return executorRegistry.get(type);
}

export function registerNodeExecutor(executor: INodeExecutor): void {
    executorRegistry.set(executor.type, executor);
}
