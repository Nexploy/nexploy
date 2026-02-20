import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { handleAsync } from '@/helpers/handleAsync';
import { DeployOptions } from '@workspace/typescript-interface/inngest/deploy';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import {
    buildDockerHostEnv,
    getComposeContainerIds,
    runDockerCompose,
} from '@/utils/dockerComposeRunner';
import { substituteEnvVars } from '@/utils/composePreprocessor';
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
        const { projectName, envVars, composeConfig } = await c.req.json<{
            repositoryId: string;
            projectName: string;
            envVars?: Record<string, string>;
            composeConfig: string;
        }>();

        const dockerClient = getCurrentDockerClient();
        const environmentId = getCurrentEnvironmentId();

        const envConfig = environmentId
            ? dockerClientRegistry.getEnvironmentConfig(environmentId)
            : null;
        const dockerEnvResult = buildDockerHostEnv(envConfig);
        const dockerEnv = dockerEnvResult.env;

        let composeYaml = Buffer.from(composeConfig, 'base64').toString('utf8');

        composeYaml = substituteEnvVars(composeYaml, envVars || {});

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

            try {
                await runDockerCompose(
                    ['-p', projectName, '-f', composeFilePath, 'down', '--remove-orphans'],
                    tmpDir,
                    dockerEnv,
                    () => {},
                );
            } catch {
                logger.debug({ projectName }, 'No existing compose stack to remove');
            }

            const existingContainers = await dockerClient.listContainers({
                all: true,
                filters: {
                    label: [`com.docker.compose.project=${projectName}`],
                },
            });
            await Promise.all(
                existingContainers.map(async (containerInfo) => {
                    try {
                        const container = dockerClient.getContainer(containerInfo.Id);
                        if (containerInfo.State === 'running') {
                            await container.stop();
                        }
                        await container.remove({ force: true });
                    } catch {}
                }),
            );

            if (composeContent.services) {
                await Promise.all(
                    (Object.values(composeContent.services) as any[]).map(async (service) => {
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
                    }),
                );
            }

            if (composeContent.networks) {
                await Promise.all(
                    Object.keys(composeContent.networks).map(async (networkName) => {
                        const fullNetworkName = `${projectName}_${networkName}`;
                        try {
                            const network = dockerClient.getNetwork(fullNetworkName);
                            const networkInfo = await network.inspect();
                            const connectedContainers = networkInfo.Containers || {};
                            await Promise.all(
                                Object.keys(connectedContainers).map(async (containerId) => {
                                    try {
                                        await network.disconnect({
                                            Container: containerId,
                                            Force: true,
                                        });
                                    } catch {}
                                }),
                            );
                            await network.remove();
                        } catch {}
                    }),
                );
            }

            const upCode = await runDockerCompose(
                ['-p', projectName, '-f', composeFilePath, 'up', '-d', '--remove-orphans'],
                tmpDir,
                dockerEnv,
                () => {},
            );
            if (upCode !== 0) {
                throw new Error(`docker compose up failed with exit code ${upCode}`);
            }

            const containerIds = await getComposeContainerIds(
                projectName,
                composeFilePath,
                tmpDir,
                dockerEnv,
            );

            const traefikNetwork = dockerClient.getNetwork('nexploy_traefik_network');
            await Promise.all(
                containerIds.map(async (containerId: string) => {
                    try {
                        await traefikNetwork.connect({ Container: containerId });
                    } catch {
                        logger.warn(
                            { containerId: containerId.substring(0, 12) },
                            'Could not connect container to Traefik network',
                        );
                    }
                }),
            );

            return { success: true, containers: containerIds };
        } finally {
            dockerEnvResult.cleanup?.();
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {}
        }
    }),
);

export default app;
