import { z } from 'zod';
import { refable } from './nodeFieldRef.schema.ts';

const httpGitUrl = (label: string) =>
    z
        .string()
        .min(1, `${label} is required`)
        .refine((v) => {
            try {
                return ['http:', 'https:'].includes(new URL(v).protocol);
            } catch {
                return false;
            }
        }, `${label} must be a valid http(s) URL`);

const relativePath = (label: string) =>
    z
        .string()
        .min(1, `${label} is required`)
        .refine((v) => !v.startsWith('/'), `${label} must be a relative path`)
        .refine((v) => !v.split('/').some((seg) => seg === '..'), `${label} must not contain '..'`)
        .refine((v) => !/[`$\\|;&<>()\n\r]/.test(v), `${label} contains invalid characters`);

export const cloneRepositoryConfigSchema = z.object({
    branch: z.string().default('main'),
    commitHash: z.string().optional(),
    submodules: z.boolean().default(false),
});

export const webhookCloneConfigSchema = z.object({
    branchFilter: z.string().optional(),
    submodules: z.boolean().default(false),
});

export const buildDockerImageConfigSchema = z.object({
    dockerfilePath: refable(relativePath('Dockerfile path')).default('Dockerfile'),
    dockerfileFilePath: refable(relativePath('Dockerfile file path')).optional(),
});

export const validateDockerfileConfigSchema = z.object({
    dockerfilePath: relativePath('Dockerfile path').default('Dockerfile'),
});

export const composeFileConfigSchema = z.object({
    composeFileName: refable(z.string().min(1, 'Compose file name is required')).default(
        'docker-compose.yml',
    ),
    composeFilePath: refable(relativePath('Compose file path')).optional(),
});

export const varEntrySchema = z.object({
    id: z.string(),
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
});

export const setEnvVarsConfigSchema = z.object({
    vars: z.array(varEntrySchema).default([]),
});

export const pushToRegistryConfigSchema = z.object({
    registryId: z.string().min(1, 'Registry is required').default(''),
    registryName: z.string().default(''),
    imageName: refable(z.string()).default(''),
});

export const pullFromRegistryConfigSchema = z.object({
    registryId: z.string().default('docker-hub'),
    imageName: z.string().min(1, 'Image name is required').default(''),
});

export const setEnvironmentConfigSchema = z.object({
    environmentId: z.string().min(1, 'Environment is required').default(''),
});

export const sendNotificationConfigSchema = z.object({
    webhookUrl: z.string().min(1, 'Webhook URL is required').default(''),
    triggerOn: z.array(z.enum(['success', 'failure', 'always'])).default(['always']),
    message: z.string().optional(),
});

export const stopContainerConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
});

export const startContainerConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
});

export const restartContainerConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
});

export const removeContainerConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
});

export const deleteContainerConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
    force: z.boolean().default(false),
});

const createContainerPortSchema = z.object({
    hostPort: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    containerPort: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
});

const createContainerEnvVarSchema = z.object({
    key: z.string(),
    value: z.string(),
});

const createContainerVolumeSchema = z.object({
    hostPath: z.string(),
    containerPath: z.string(),
    readOnly: z.boolean().default(false),
});

export const createContainerConfigSchema = z.object({
    containerName: refable(z.string()).default(''),
    imageName: refable(z.string().min(1, 'Image name is required')),
    restartPolicy: z
        .enum(['no', 'always', 'on-failure', 'unless-stopped'])
        .default('unless-stopped'),
    networkName: refable(z.string()).optional(),
    portsSource: refable(z.array(createContainerPortSchema)).optional(),
    ports: z.array(createContainerPortSchema).default([]),
    envVarsSource: refable(z.array(createContainerEnvVarSchema)).optional(),
    envVars: z.array(createContainerEnvVarSchema).default([]),
    volumesSource: refable(z.array(createContainerVolumeSchema)).optional(),
    volumes: z.array(createContainerVolumeSchema).default([]),
});

export const createNetworkConfigSchema = z.object({
    name: refable(z.string().min(1, 'Network name is required')).default(''),
    driver: z.string().default('bridge'),
});

export const createVolumeConfigSchema = z.object({
    name: refable(z.string().min(1, 'Volume name is required')).default(''),
    driver: z.string().optional(),
});

// ─── Flow Control ───────────────────────────────────────────────────────────

export const waitForHealthConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')),
    timeout: z.coerce.number().min(1, 'Timeout must be positive').default(60),
    interval: z.coerce.number().min(1, 'Interval must be positive').default(5),
});

export const waitForUrlConfigSchema = z.object({
    url: z.string().min(1, 'URL is required').default(''),
    expectedStatus: z.coerce
        .number()
        .min(100, 'Status code must be between 100 and 599')
        .max(599, 'Status code must be between 100 and 599')
        .default(200),
    timeout: z.coerce.number().min(1, 'Timeout must be positive').default(60),
    interval: z.coerce.number().min(1, 'Interval must be positive').default(5),
    method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
});

export const waitForPortConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')),
    port: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535')
        .default(80),
    timeout: z.coerce.number().min(1, 'Timeout must be positive').default(60),
    interval: z.coerce.number().min(1, 'Interval must be positive').default(3),
});

export const delayConfigSchema = z.object({
    seconds: z.coerce.number().min(1, 'Delay must be at least 1 second').default(5),
});

export const conditionConfigSchema = z.object({
    operator: z.enum(['and', 'or']).default('and'),
});

// ─── Script Execution ────────────────────────────────────────────────────────

export const runCommandInContainerConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
    command: refable(z.string().min(1, 'Command is required')).default(''),
    workdir: refable(
        z.string().refine((v) => v.startsWith('/'), {
            message: 'Container working directory must be an absolute path',
        }),
    ).default('/app'),
    user: refable(z.string()).default(''),
    continueOnError: z.boolean().default(false),
});

// ─── HTTP / Webhooks ─────────────────────────────────────────────────────────

export const httpRequestConfigSchema = z.object({
    url: refable(z.url()).default(''),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('POST'),
    headers: z
        .array(
            z.object({
                id: z.string(),
                key: refable(z.string().min(1, 'Header key is required')),
                value: refable(z.string().min(1, 'Header value is required')),
            }),
        )
        .default([]),
    body: refable(z.string()).optional(),
    expectedStatus: z.coerce
        .number()
        .min(100, 'Status code must be between 100 and 599')
        .max(599, 'Status code must be between 100 and 599')
        .default(200),
    continueOnError: z.boolean().default(false),
});

export const updateCommitStatusConfigSchema = z.object({
    state: z.enum(['pending', 'success', 'failure', 'error']).default('pending'),
    context: refable(z.string().default('nexploy/pipeline')),
    description: refable(z.string()).default(''),
});

// ─── Image Management ────────────────────────────────────────────────────────

export const tagImageConfigSchema = z.object({
    sourceImage: refable(z.string().min(1, 'Source image is required')).default(''),
    targetTag: refable(z.string().min(1, 'Target tag is required')).default(''),
});

export const scanImageConfigSchema = z.object({
    image: z.string().min(1, 'Image is required').default(''),
    trivyVersion: z.string().default('canary'),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
    exitOnVulnerabilities: z.boolean().default(true),
});

export const pruneImagesConfigSchema = z.object({
    filter: z.string().optional(),
    olderThan: z.string().optional(),
    dangling: z.boolean().default(true),
});

export const deleteImageConfigSchema = z.object({
    imageId: refable(z.string().min(1, 'Image ID is required')).default(''),
    force: z.boolean().default(false),
});

export const deleteNetworkConfigSchema = z.object({
    networkId: refable(z.string().min(1, 'Network ID is required')).default(''),
    force: z.boolean().default(false),
});

export const deleteVolumeConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    force: z.boolean().default(false),
});

// ─── Files & Artifacts ───────────────────────────────────────────────────────

export const downloadFileConfigSchema = z.object({
    url: refable(z.string().min(1, 'URL is required')).default(''),
    destinationPath: refable(relativePath('Destination path')).default('.'),
    filename: refable(z.string()).optional(),
});

// ─── Database ────────────────────────────────────────────────────────────────

export const backupVolumeS3ConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    accountId: z.string().min(1, 'AWS account ID is required').default(''),
    bucket: refable(z.string().min(1, 'Bucket name is required')).default(''),
});

// ─── Docker Swarm ─────────────────────────────────────────────────────────────

export const updateServiceConfigSchema = z.object({
    serviceId: z.string().min(1, 'Service ID is required').default(''),
    serviceName: refable(z.string().min(1, 'Service name is required')).default(''),
    image: refable(z.string().min(1, 'Image is required')).default(''),
    forceUpdate: z.boolean().default(false),
});

export const scaleServiceConfigSchema = z.object({
    serviceId: z.string().min(1, 'Service ID is required').default(''),
    serviceName: refable(z.string().min(1, 'Service name is required')).default(''),
    replicas: z.coerce.number().min(1, 'Replicas must be at least 1').default(1),
});

const createServicePortSchema = z.object({
    publishedPort: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    targetPort: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
});

const createServiceEnvVarSchema = z.object({
    key: z.string(),
    value: z.string(),
});

export const createServiceConfigSchema = z.object({
    serviceName: refable(z.string().min(1, 'Service name is required')).default(''),
    imageName: refable(z.string().min(1, 'Image name is required')).default(''),
    mode: z.enum(['replicated', 'global']).default('replicated'),
    replicas: z.coerce.number().min(1, 'Replicas must be at least 1').default(1),
    portsSource: refable(z.array(createServicePortSchema)).optional(),
    ports: z.array(createServicePortSchema).default([]),
    envVarsSource: refable(z.array(createServiceEnvVarSchema)).optional(),
    envVars: z.array(createServiceEnvVarSchema).default([]),
    networks: z.array(z.object({ value: z.string() })).default([]),
    constraints: z.array(z.object({ value: z.string() })).default([]),
});

// ─── Monitoring ───────────────────────────────────────────────────────────────

export const checkContainerLogsConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
    pattern: refable(z.string().min(1, 'Pattern is required')).default(''),
    since: refable(z.string()).default(''),
    timeout: z.coerce.number().min(1, 'Timeout must be at least 1 second').default(30),
    failIfFound: z.boolean().default(false),
});

// ─── Cache ────────────────────────────────────────────────────────────────────

const cacheKeySchema = z
    .string()
    .regex(
        /^[a-zA-Z0-9_\-.]+$/,
        'Cache key must only contain alphanumeric characters, hyphens, underscores or dots',
    );

export const cacheRestoreConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    cachePath: refable(relativePath('Cache path')).default(''),
    cacheKey: refable(cacheKeySchema).optional(),
});

export const cacheSaveConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    sourcePath: refable(relativePath('Source path')).default(''),
    cacheKey: refable(cacheKeySchema).optional(),
});

// ─── Git ─────────────────────────────────────────────────────────────────────

export const gitTagConfigSchema = z.object({
    tagName: z.string().min(1, 'Tag name is required').default(''),
    message: refable(z.string()).optional(),
    remote: z.string().default('origin'),
});

export const gitCloneExtraConfigSchema = z.object({
    repoUrl: httpGitUrl('Repository URL').default(''),
    branch: z.string().default('main'),
    targetDir: relativePath('Target directory').default('extra'),
    token: z.string().optional(),
});

export const cherryPickCommitConfigSchema = z.object({
    commitHash: refable(z.string().min(1, 'Commit hash is required')).default(''),
    targetBranch: z.string().default(''),
    noCommit: z.boolean().default(false),
    remote: z.string().default('origin'),
});

export const mergeBranchConfigSchema = z.object({
    sourceBranch: z.string().min(1, 'Source branch is required').default(''),
    targetBranch: z.string().min(1, 'Target branch is required').default(''),
    strategy: z.enum(['merge', 'squash']).default('merge'),
    message: refable(z.string()).default(''),
    remote: z.string().default('origin'),
    push: z.boolean().default(false),
});

export const createReleaseConfigSchema = z.object({
    tagName: refable(z.string().min(1, 'Tag name is required')).default(''),
    targetBranch: z.string().default('main'),
    releaseTitle: refable(z.string()).default(''),
    releaseNotes: refable(z.string()).default(''),
    draft: z.boolean().default(false),
    prerelease: z.boolean().default(false),
});

// ─── Code Quality ─────────────────────────────────────────────────────────────

export const sonarqubeScanConfigSchema = z.object({
    mode: z.enum(['local', 'custom']).default('local'),
    projectKey: z.string().default(''),
    token: z.string().default(''),
    sources: z.string().default('.'),
    exclusions: z.string().optional(),
    qualityGate: z.boolean().default(true),
    enforceMinScore: z.boolean().default(false),
    scoreMetric: z.enum(['coverage', 'line_coverage', 'branch_coverage']).default('coverage'),
    minScore: z.coerce
        .number()
        .min(0, 'Minimum score must be between 0 and 100')
        .max(100, 'Minimum score must be between 0 and 100')
        .default(80),
    timeoutSeconds: z.coerce.number().default(300),
    serverUrl: z.string().default('https://sonarcloud.io'),
    organization: z.string().optional(),
    sonarqubeVersion: z.string().default('community'),
    sonarqubePort: z.coerce
        .number()
        .min(1, 'Host Port must be between 1 and 65535')
        .max(65535, 'Host Port must be between 1 and 65535')
        .default(9000),
});

// ─── Secrets ─────────────────────────────────────────────────────────────────

export const fetchSecretsVaultConfigSchema = z.object({
    endpoint: refable(z.string().min(1, 'Vault endpoint is required')).default(''),
    token: refable(z.string().min(1, 'Token is required')).default(''),
    secretPath: refable(z.string().min(1, 'Secret path is required')).default(''),
    kvVersion: z.enum(['v1', 'v2']).default('v2'),
    namespace: refable(z.string()).optional(),
});

export const fetchSecretsDopplerConfigSchema = z.object({
    serviceToken: refable(z.string().min(1, 'Service token is required')).default(''),
    project: refable(z.string()).optional(),
    config: refable(z.string()).optional(),
});

// ─── Domain & SSL ─────────────────────────────────────────────────────────────

export const addDomainConfigSchema = z
    .object({
        host: z.string().min(1, 'Host is required').default(''),
        path: z.string().min(1).default('/'),
        internalPath: z.string().min(1).default('/'),
        stripPath: z.boolean().default(false),
        containerPort: z.coerce.number().int().min(1).max(65535).default(3000),
        https: z.boolean().default(false),
        certificateId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.https && !data.certificateId) {
            ctx.addIssue({
                code: 'custom',
                message: 'certificateRequired',
                path: ['certificateId'],
            });
        }
    });

export const removeDomainConfigSchema = z.object({
    host: refable(z.string().min(1, 'Host is required')).default(''),
});

// ─── Stage Orchestration ──────────────────────────────────────────────────────

export const triggerStageBuildConfigSchema = z.object({
    stageId: z.string().min(1, 'Target stage is required').default(''),
    stageName: z.string().default(''),
    triggerOnFailure: z.boolean().default(false),
});

export const addSslCertificateConfigSchema = z.object({
    certType: z.enum(['LETS_ENCRYPT', 'CUSTOM']).default('LETS_ENCRYPT'),
    name: z.string().min(1, 'Name is required').default(''),
    domain: z.string().min(1, 'Domain is required').default(''),
    email: z.string().optional(),
    agreedToTos: z.boolean().default(false),
    certificate: z.string().optional(),
    privateKey: z.string().optional(),
});
