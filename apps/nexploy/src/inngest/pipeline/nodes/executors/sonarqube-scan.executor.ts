import ky from 'ky';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { sonarqubeScanConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ContainerInspectInfo } from 'dockerode';

type Config = z.infer<typeof sonarqubeScanConfigSchema>;

export class SonarqubeScanExecutor implements INodeExecutor {
    readonly type = 'sonarqube-scan';
    readonly configSchema = sonarqubeScanConfigSchema;

    async execute(ctx: NodeExecutionContext<Config>): Promise<NodeExecutionResult> {
        const { buildConfig, nodeId, nodeConfig, allOutputs, logger, abortSignal, edges } = ctx;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        if (!workDir) {
            throw new Error('No workDir found — connect this node after a Clone Repository node');
        }

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );
        const {
            mode,
            projectKey,
            token,
            sources,
            exclusions,
            qualityGate,
            enforceMinScore,
            scoreMetric,
            minScore,
            timeoutSeconds,
            serverUrl,
            organization,
            sonarqubeVersion,
            sonarqubePort,
        } = nodeConfig;

        const repositorySlug = `nexploy-${buildConfig.repositoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        const resolvedProjectKey = projectKey || repositorySlug;

        await logger.info(nodeId, `Starting SonarQube analysis (mode: ${mode})`);
        await logger.info(nodeId, `Project key: ${resolvedProjectKey}`);

        if (abortSignal.aborted) throw new Error('Build cancelled');

        const sonarData = {
            nodeId,
            workDir,
            environmentId,
            projectKey: resolvedProjectKey,
            token,
            sources,
            exclusions,
            qualityGate,
            enforceMinScore,
            scoreMetric,
            minScore,
            timeoutSeconds,
            logger,
            abortSignal,
        };

        if (mode === 'custom') {
            return this.runRemote({
                ...sonarData,
                serverUrl,
                organization,
            });
        }

        return this.runLocal({
            ...sonarData,
            sonarqubeVersion,
            sonarqubePort,
        });
    }

    private async runRemote(opts: {
        nodeId: string;
        workDir: string;
        environmentId: string | undefined;
        projectKey: string;
        token: string;
        sources: string;
        exclusions: string | undefined;
        qualityGate: boolean;
        enforceMinScore: boolean;
        scoreMetric: string;
        minScore: number;
        timeoutSeconds: number;
        serverUrl: string;
        organization: string | undefined;
        logger: NodeExecutionContext<Config>['logger'];
        abortSignal: AbortSignal;
    }): Promise<NodeExecutionResult> {
        const {
            nodeId,
            workDir,
            environmentId,
            projectKey,
            token,
            sources,
            exclusions,
            qualityGate,
            enforceMinScore,
            scoreMetric,
            minScore,
            timeoutSeconds,
            serverUrl,
            organization,
            logger,
            abortSignal,
        } = opts;

        await logger.info(nodeId, `Connecting to SonarQube server: ${serverUrl}`);

        const sonarArgs = buildSonarArgs({
            serverUrl,
            projectKey,
            token,
            sources,
            exclusions,
            organization,
        });

        const result = await kyDocker
            .post('container/run-ephemeral', {
                json: {
                    image: 'sonarsource/sonar-scanner-cli:latest',
                    command: `sonar-scanner ${sonarArgs}`,
                    workdir: '/workspace',
                    mountPath: workDir,
                },
                signal: abortSignal,
                environmentId,
                timeout: timeoutSeconds * 1000,
            } as KyDockerOptions)
            .json<{ exitCode: number; output?: string }>();

        if (result.output) {
            for (const line of result.output.split('\n')) {
                if (line.trim()) await logger.info(nodeId, line);
            }
        }

        if (result.exitCode !== 0) {
            throw new Error(`sonar-scanner failed with exit code ${result.exitCode}`);
        }

        let qualityGatePassed = true;
        if (qualityGate) {
            await logger.info(nodeId, 'Checking quality gate status...');
            qualityGatePassed = await this.checkQualityGate(
                serverUrl,
                projectKey,
                token,
                logger,
                nodeId,
            );
            if (!qualityGatePassed) {
                throw new Error(`Quality gate failed for project ${projectKey}`);
            }
            await logger.info(nodeId, 'Quality gate passed');
        }

        const scoreResult = enforceMinScore
            ? await this.enforceMinScore(
                  serverUrl,
                  projectKey,
                  token,
                  scoreMetric,
                  minScore,
                  logger,
                  nodeId,
              )
            : undefined;

        return {
            output: {
                qualityGatePassed,
                projectKey,
                ...(scoreResult ? { score: scoreResult.value, scoreMetric } : {}),
            },
        };
    }

    private async runLocal(opts: {
        nodeId: string;
        workDir: string;
        environmentId: string | undefined;
        projectKey: string;
        token: string;
        sources: string;
        exclusions: string | undefined;
        qualityGate: boolean;
        enforceMinScore: boolean;
        scoreMetric: string;
        minScore: number;
        timeoutSeconds: number;
        sonarqubeVersion: string;
        sonarqubePort: number;
        logger: NodeExecutionContext<Config>['logger'];
        abortSignal: AbortSignal;
    }): Promise<NodeExecutionResult> {
        const {
            nodeId,
            workDir,
            environmentId,
            projectKey,
            token,
            sources,
            exclusions,
            qualityGate,
            enforceMinScore,
            scoreMetric,
            minScore,
            timeoutSeconds,
            sonarqubeVersion,
            sonarqubePort,
            logger,
            abortSignal,
        } = opts;

        const SONARQUBE_CONTAINER_NAME = 'nexploy-sonarqube';
        const localServerUrl = `http://localhost:${sonarqubePort}`;

        try {
            const info = await kyDocker
                .get(`container/${SONARQUBE_CONTAINER_NAME}`, {
                    environmentId,
                } as KyDockerOptions)
                .json<ContainerInspectInfo>();

            if (info.State.Running) {
                await logger.info(
                    nodeId,
                    'Local SonarQube container is already running, reusing it.',
                );
            } else {
                await logger.info(
                    nodeId,
                    'Local SonarQube container exists but is stopped, starting it...',
                );
                await kyDocker.post('container/start', {
                    signal: abortSignal,
                    environmentId,
                    json: { containerIds: [info.Id] },
                } as KyDockerOptions);
            }
            await logger.info(nodeId, 'Waiting for SonarQube to be ready...');
            await this.waitForSonarQube(localServerUrl, 120, logger, nodeId);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            const message = (err as { message?: string })?.message ?? '';
            if (status !== 404 && !message.includes('404')) throw err;

            await logger.info(
                nodeId,
                `Creating local SonarQube container (${sonarqubeVersion})...`,
            );
            await kyDocker
                .post('container/create', {
                    json: {
                        name: SONARQUBE_CONTAINER_NAME,
                        image: `sonarqube:${sonarqubeVersion}`,
                        ports: [
                            {
                                containerPort: 9000,
                                hostPort: sonarqubePort,
                                protocol: 'tcp',
                            },
                        ],
                        volumes: [
                            {
                                hostPath: 'nexploy-sonarqube-data',
                                containerPath: '/opt/sonarqube/data',
                                readOnly: false,
                            },
                            {
                                hostPath: 'nexploy-sonarqube-conf',
                                containerPath: '/opt/sonarqube/conf',
                                readOnly: false,
                            },
                            {
                                hostPath: 'nexploy-sonarqube-extensions',
                                containerPath: '/opt/sonarqube/extensions',
                                readOnly: false,
                            },
                            {
                                hostPath: 'nexploy-sonarqube-logs',
                                containerPath: '/opt/sonarqube/logs',
                                readOnly: false,
                            },
                            {
                                hostPath: 'nexploy-sonarqube-temp',
                                containerPath: '/opt/sonarqube/temp',
                                readOnly: false,
                            },
                        ],
                        envVars: [{ key: 'SONAR_ES_BOOTSTRAP_CHECKS_DISABLE', value: 'true' }],
                        restart: 'no',
                    },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ id: string }>();

            await logger.info(nodeId, 'Waiting for SonarQube to be ready...');
            await this.waitForSonarQube(localServerUrl, 120, logger, nodeId);
        }

        const scanToken = token || (await this.generateLocalToken(localServerUrl));
        await logger.info(nodeId, 'Running sonar-scanner against local SonarQube...');
        const sonarArgs = buildSonarArgs({
            serverUrl: localServerUrl,
            projectKey,
            token: scanToken,
            sources,
            exclusions,
            organization: undefined,
        });

        const scanResult = await kyDocker
            .post('container/run-ephemeral', {
                json: {
                    image: 'sonarsource/sonar-scanner-cli:latest',
                    command: `sonar-scanner ${sonarArgs}`,
                    workdir: '/workspace',
                    mountPath: workDir,
                    networkMode: 'host',
                },
                signal: abortSignal,
                environmentId,
                timeout: timeoutSeconds * 1000,
            } as KyDockerOptions)
            .json<{ exitCode: number; output?: string }>();

        if (scanResult.output) {
            for (const line of scanResult.output.split('\n')) {
                if (line.trim()) await logger.info(nodeId, line);
            }
        }

        if (scanResult.exitCode !== 0) {
            throw new Error(`sonar-scanner failed with exit code ${scanResult.exitCode}`);
        }

        let qualityGatePassed = true;
        if (qualityGate) {
            await logger.info(nodeId, 'Checking quality gate status...');
            qualityGatePassed = await this.checkQualityGate(
                localServerUrl,
                projectKey,
                scanToken,
                logger,
                nodeId,
            );
            if (!qualityGatePassed) {
                throw new Error(`Quality gate failed for project ${projectKey}`);
            }
            await logger.info(nodeId, 'Quality gate passed');
        }

        const scoreResult = enforceMinScore
            ? await this.enforceMinScore(
                  localServerUrl,
                  projectKey,
                  scanToken,
                  scoreMetric,
                  minScore,
                  logger,
                  nodeId,
              )
            : undefined;

        return {
            output: {
                qualityGatePassed,
                projectKey,
                ...(scoreResult ? { score: scoreResult.value, scoreMetric } : {}),
            },
        };
    }

    private async generateLocalToken(serverUrl: string): Promise<string> {
        const auth = Buffer.from('admin:admin').toString('base64');
        const tokenName = `nexploy-scan-${Date.now()}`;
        const data = await ky
            .post(`${serverUrl}/api/user_tokens/generate?name=${encodeURIComponent(tokenName)}`, {
                headers: { Authorization: `Basic ${auth}` },
            })
            .json<{ token: string }>();
        return data.token;
    }

    private async waitForSonarQube(
        serverUrl: string,
        maxWaitSeconds: number,
        logger: NodeExecutionContext<Config>['logger'],
        nodeId: string,
    ): Promise<void> {
        const deadline = Date.now() + maxWaitSeconds * 1000;
        while (Date.now() < deadline) {
            try {
                const data = await ky.get(`${serverUrl}/api/system/status`).json<{ status: string }>();
                if (data.status === 'UP') return;
                await logger.info(nodeId, `SonarQube status: ${data.status}, waiting...`);
            } catch {}
            await new Promise((r) => setTimeout(r, 5000));
        }
        throw new Error(`SonarQube did not become ready within ${maxWaitSeconds}s`);
    }

    private async checkQualityGate(
        serverUrl: string,
        projectKey: string,
        token: string,
        logger: NodeExecutionContext<Config>['logger'],
        nodeId: string,
    ): Promise<boolean> {
        await new Promise((r) => setTimeout(r, 5000));

        const auth = Buffer.from(`${token}:`).toString('base64');
        const url = `${serverUrl}/api/qualitygates/project_status?projectKey=${encodeURIComponent(projectKey)}`;

        try {
            const data = await ky
                .get(url, {
                    headers: { Authorization: `Basic ${auth}` },
                    timeout: 15000,
                })
                .json<{ projectStatus: { status: string } }>();
            const status = data.projectStatus?.status;
            await logger.info(nodeId, `Quality gate status: ${status}`);
            return status === 'OK' || status === 'NONE';
        } catch (err) {
            await logger.info(
                nodeId,
                `Could not check quality gate: ${err instanceof Error ? err.message : err}`,
            );
            return true;
        }
    }

    private async enforceMinScore(
        serverUrl: string,
        projectKey: string,
        token: string,
        metric: string,
        minScore: number,
        logger: NodeExecutionContext<Config>['logger'],
        nodeId: string,
    ): Promise<{ value: number }> {
        await logger.info(nodeId, `Checking minimum score (${metric} >= ${minScore})...`);

        await new Promise((r) => setTimeout(r, 5000));

        const auth = Buffer.from(`${token}:`).toString('base64');
        const url = `${serverUrl}/api/measures/component?component=${encodeURIComponent(projectKey)}&metricKeys=${encodeURIComponent(metric)}`;

        const data = await ky
            .get(url, {
                headers: { Authorization: `Basic ${auth}` },
                timeout: 15000,
            })
            .json<{
                component?: { measures?: { metric: string; value?: string }[] };
            }>();
        const measure = data.component?.measures?.find((m) => m.metric === metric);
        const rawValue = measure?.value;

        if (rawValue === undefined) {
            throw new Error(
                `Metric "${metric}" is not available for project ${projectKey}. ` +
                    `Make sure the analysis produces this measure (e.g. coverage requires a coverage report).`,
            );
        }

        const value = Number(rawValue);
        await logger.info(nodeId, `${metric} = ${value} (required >= ${minScore})`);

        if (Number.isNaN(value) || value < minScore) {
            throw new Error(
                `Score check failed: ${metric} = ${rawValue} is below the required minimum of ${minScore}`,
            );
        }

        await logger.info(nodeId, 'Minimum score requirement met');
        return { value };
    }
}

function buildSonarArgs(opts: {
    serverUrl: string;
    projectKey: string;
    token: string;
    sources: string;
    exclusions: string | undefined;
    organization: string | undefined;
}): string {
    const args = [
        `-Dsonar.host.url=${opts.serverUrl}`,
        `-Dsonar.token=${opts.token}`,
        `-Dsonar.projectKey=${opts.projectKey}`,
        `-Dsonar.sources=${opts.sources}`,
    ];
    if (opts.exclusions) {
        args.push(`-Dsonar.exclusions=${opts.exclusions}`);
    }
    if (opts.organization) {
        args.push(`-Dsonar.organization=${opts.organization}`);
    }
    return args.join(' ');
}

export const sonarqubeScanExecutor = new SonarqubeScanExecutor();
