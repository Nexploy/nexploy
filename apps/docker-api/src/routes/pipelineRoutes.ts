import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { handleAsync } from '@/helpers/handleAsync';
import { DeployOptions } from '@workspace/typescript-interface/inngest/deploy';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import DockerodeCompose from 'dockerode-compose';
import { substituteEnvVars } from '@/utils/composePreprocessor';
import { getTranslations } from '@/middleware/locale.middleware';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '@/utils/logger';

const app = new Hono();

app.post(
    '/deploy',
    handleAsync(async (c) => {
        const { repositoryId, imageName, options } = await c.req.json<{
            repositoryId: string;
            imageName: string;
            options?: DeployOptions;
        }>();

        return await containersStateManager.deploy(repositoryId, imageName, options);
    }),
);

app.post(
    '/deploy-compose',
    handleAsync(async (c) => {
        const { repositoryId, buildId, projectName, envVars } = await c.req.json<{
            repositoryId: string;
            buildId: string;
            projectName: string;
            envVars?: Record<string, string>;
        }>();

        const dockerClient = getCurrentDockerClient();
        const manifestTag = `${repositoryId}:${buildId}`;

        const imageInfo = await dockerClient.getImage(manifestTag).inspect();
        const configB64 = imageInfo.Config?.Labels?.['nexploy.compose.config'];

        if (!configB64) {
            const t = getTranslations(c, 'docker');
            throw new Error(t('errors.manifestNoComposeConfig'));
        }

        let composeYaml = Buffer.from(configB64, 'base64').toString('utf8');

        if (envVars && Object.keys(envVars).length > 0) {
            composeYaml = substituteEnvVars(composeYaml, envVars);
        }

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexploy-compose-'));
        const composeFilePath = path.join(tmpDir, 'docker-compose.yml');

        try {
            fs.writeFileSync(composeFilePath, composeYaml, 'utf8');

            if (envVars && Object.keys(envVars).length > 0) {
                const envContent = Object.entries(envVars)
                    .map(([key, value]) => {
                        const escapedValue =
                            value.includes('\n') || value.includes('"') || value.includes("'")
                                ? `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
                                : value;
                        return `${key}=${escapedValue}`;
                    })
                    .join('\n');
                fs.writeFileSync(path.join(tmpDir, '.env'), envContent, 'utf8');
            }

            const composeContent = yaml.parse(composeYaml) as Record<string, any>;
            const compose = new DockerodeCompose(dockerClient, composeFilePath, projectName);

            try {
                await compose.down({ volumes: false });
            } catch {
                logger.debug({ projectName }, 'No existing compose stack to remove');
            }

            // Force-remove any remaining compose containers by project label
            const existingContainers = await dockerClient.listContainers({
                all: true,
                filters: {
                    label: [`com.docker.compose.project=${projectName}`],
                },
            });
            for (const containerInfo of existingContainers) {
                try {
                    const container = dockerClient.getContainer(containerInfo.Id);
                    if (containerInfo.State === 'running') {
                        await container.stop();
                    }
                    await container.remove({ force: true });
                } catch {}
            }

            // Remove containers with explicit container_name from compose config
            if (composeContent.services) {
                for (const service of Object.values(composeContent.services) as any[]) {
                    if (service.container_name) {
                        try {
                            const container = dockerClient.getContainer(service.container_name);
                            const info = await container.inspect();
                            if (info.State.Running) {
                                await container.stop();
                            }
                            await container.remove({ force: true });
                        } catch {}
                    }
                }
            }

            if (composeContent.networks) {
                for (const networkName of Object.keys(composeContent.networks)) {
                    const fullNetworkName = `${projectName}_${networkName}`;
                    try {
                        const network = dockerClient.getNetwork(fullNetworkName);
                        const networkInfo = await network.inspect();
                        const connectedContainers = networkInfo.Containers || {};
                        for (const containerId of Object.keys(connectedContainers)) {
                            try {
                                await network.disconnect({
                                    Container: containerId,
                                    Force: true,
                                });
                            } catch {}
                        }
                        await network.remove();
                    } catch {}
                }
            }

            const upResult = await compose.up({ verbose: true });
            const containerIds = upResult.services.map(
                (container: { id: string }) => container.id,
            );

            for (const containerId of containerIds) {
                try {
                    const network = dockerClient.getNetwork('nexploy_traefik_network');
                    await network.connect({ Container: containerId });
                } catch {
                    logger.warn(
                        { containerId: containerId.substring(0, 12) },
                        'Could not connect container to Traefik network',
                    );
                }
            }

            return { success: true, containers: containerIds };
        } finally {
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {}
        }
    }),
);

export default app;
