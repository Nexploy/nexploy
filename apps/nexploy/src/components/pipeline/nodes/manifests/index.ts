import { type NodeManifest } from '../../types/nodeManifest';
import { cloneRepositoryManifest } from './clone-repository.manifest';
import { webhookCloneManifest } from './webhook-clone.manifest';
import { validateDockerfileManifest } from './validate-dockerfile.manifest';
import { validateComposeManifest } from './validate-compose.manifest';
import { buildDockerImageManifest } from './build-docker-image.manifest';
import { pushToRegistryManifest } from './push-to-registry.manifest';
import { setEnvironmentManifest } from './set-environment.manifest';
import { deployContainerManifest } from './deploy-container.manifest';
import { deployComposeManifest } from './deploy-compose.manifest';
import { writeEnvFileManifest } from './write-env-file.manifest';
import { setEnvVarsManifest } from './set-env-vars.manifest';
import { cleanWorkdirManifest } from './clean-workdir.manifest';
import { sendNotificationManifest } from './send-notification.manifest';
import { saveVersionManifest } from './save-version.manifest';
import { pullImageManifest } from './pull-image.manifest';
import { startContainerManifest } from './start-container.manifest';
import { stopContainerManifest } from './stop-container.manifest';
import { restartContainerManifest } from './restart-container.manifest';
import { removeContainerManifest } from './remove-container.manifest';
import { createNetworkManifest } from './create-network.manifest';
import { createVolumeManifest } from './create-volume.manifest';

export const allBuiltinManifests: NodeManifest[] = [
    // Source
    cloneRepositoryManifest,
    webhookCloneManifest,
    // Build
    validateDockerfileManifest,
    validateComposeManifest,
    buildDockerImageManifest,
    pushToRegistryManifest,
    // Deploy
    setEnvironmentManifest,
    deployContainerManifest,
    deployComposeManifest,
    // Utility
    writeEnvFileManifest,
    setEnvVarsManifest,
    cleanWorkdirManifest,
    // Notification
    sendNotificationManifest,
    // Versioning
    saveVersionManifest,
    // Docker Actions
    pullImageManifest,
    startContainerManifest,
    stopContainerManifest,
    restartContainerManifest,
    removeContainerManifest,
    createNetworkManifest,
    createVolumeManifest,
];
