import { z } from 'zod';
import { refable } from './nodeFieldRef.schema.ts';

export const cloneRepositoryConfigSchema = z.object({
    branch: z.string().default('main'),
    commitHash: z.string().optional(),
});

export const webhookCloneConfigSchema = z.object({
    branchFilter: z.string().optional(),
});

export const buildDockerImageConfigSchema = z.object({
    dockerfilePath: refable(z.string().min(1, 'Dockerfile path is required')).default('Dockerfile'),
    dockerfileFilePath: refable(z.string()).optional(),
});

export const validateDockerfileConfigSchema = z.object({
    dockerfilePath: z.string().min(1, 'Dockerfile path is required').default('Dockerfile'),
});

export const composeFileConfigSchema = z.object({
    composeFileName: z
        .string()
        .min(1, 'Compose file name is required')
        .default('docker-compose.yml'),
    composeFilePath: z.string().optional(),
});

export const deployContainerConfigSchema = z.object({
    environmentId: z.string().optional(),
    ports: z
        .array(
            z.object({
                containerPort: z.number(),
                hostPort: z.number().optional(),
                protocol: z.enum(['tcp', 'udp']).default('tcp'),
            }),
        )
        .default([]),
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

const createContainerPortSchema = z.object({
    hostPort: refable(z.string()),
    containerPort: refable(z.string()),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
});

const createContainerEnvVarSchema = z.object({
    key: refable(z.string()),
    value: refable(z.string()),
});

const createContainerVolumeSchema = z.object({
    hostPath: refable(z.string()),
    containerPath: refable(z.string()),
    readOnly: z.boolean().default(false),
});

export const createContainerConfigSchema = z.object({
    containerName: refable(z.string()).optional(),
    imageName: refable(z.string()),
    restartPolicy: z
        .enum(['no', 'always', 'on-failure', 'unless-stopped'])
        .default('unless-stopped'),
    networkName: refable(z.string()).optional(),
    advanced: z.boolean().default(false),
    ports: z.array(createContainerPortSchema).default([]),
    envVars: z.array(createContainerEnvVarSchema).default([]),
    volumes: z.array(createContainerVolumeSchema).default([]),
});

export const createNetworkConfigSchema = z.object({
    name: z.string().min(1, 'Network name is required').default(''),
    driver: z.string().default('bridge'),
});

export const createVolumeConfigSchema = z.object({
    name: z.string().min(1, 'Volume name is required').default(''),
    driver: z.string().optional(),
});

// ─── Flow Control ───────────────────────────────────────────────────────────

export const waitForHealthConfigSchema = z.object({
    containerName: z.string().min(1, 'Container name is required').default(''),
    timeout: z.number().default(60),
    interval: z.number().default(5),
});

export const waitForUrlConfigSchema = z.object({
    url: z.string().min(1, 'URL is required').default(''),
    expectedStatus: z.number().default(200),
    timeout: z.number().default(60),
    interval: z.number().default(5),
    method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
});

export const waitForPortConfigSchema = z.object({
    host: z.string().min(1, 'Host is required').default(''),
    port: z.number().min(1).max(65535).default(80),
    timeout: z.number().default(60),
    interval: z.number().default(3),
});

export const delayConfigSchema = z.object({
    seconds: z.number().min(1).default(5),
});

export const conditionConfigSchema = z.object({
    operator: z.enum(['and', 'or']).default('and'),
});

// ─── Script Execution ────────────────────────────────────────────────────────

export const runScriptConfigSchema = z.object({
    script: z.string().min(1, 'Script is required').default(''),
    shell: z.enum(['bash', 'sh']).default('bash'),
    continueOnError: z.boolean().default(false),
});

export const runCommandInContainerConfigSchema = z.object({
    containerId: z.string().min(1, 'Container is required').default(''),
    command: z.string().min(1, 'Command is required').default(''),
    workdir: z.string().optional(),
});

export const runTestsConfigSchema = z.object({
    command: z.string().min(1, 'Command is required').default(''),
    image: z.string().min(1, 'Image is required').default('node:20-alpine'),
    workdir: z.string().optional(),
});

// ─── HTTP / Webhooks ─────────────────────────────────────────────────────────

export const httpRequestConfigSchema = z.object({
    url: refable(z.string().min(1, 'URL is required')).default(''),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('POST'),
    headers: z
        .array(z.object({ id: z.string(), key: z.string(), value: refable(z.string()) }))
        .default([]),
    body: z.string().optional(),
    expectedStatus: z.number().default(200),
    continueOnError: z.boolean().default(false),
});

export const updateCommitStatusConfigSchema = z.object({
    provider: z.enum(['github', 'gitlab']).default('github'),
    token: z.string().min(1, 'Token is required').default(''),
    owner: z.string().min(1, 'Owner is required').default(''),
    repo: z.string().min(1, 'Repository is required').default(''),
    sha: z.string().min(1, 'SHA is required').default(''),
    state: z.enum(['pending', 'success', 'failure', 'error']).default('pending'),
    description: z.string().optional(),
    targetUrl: z.string().optional(),
    baseUrl: z.string().default('https://gitlab.com'),
});

// ─── Image Management ────────────────────────────────────────────────────────

export const tagImageConfigSchema = z.object({
    sourceImage: z.string().min(1, 'Source image is required').default(''),
    sourceTag: z.string().default('latest'),
    targetTag: z.string().min(1, 'Target tag is required').default(''),
});

export const scanImageConfigSchema = z.object({
    image: z.string().min(1, 'Image is required').default(''),
    tag: z.string().default('latest'),
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
    networkName: refable(z.string().min(1, 'Network name is required')).default(''),
    force: z.boolean().default(false),
});

export const deleteVolumeConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    force: z.boolean().default(false),
});

// ─── Files & Artifacts ───────────────────────────────────────────────────────

export const templateFileConfigSchema = z.object({
    inputPath: z.string().min(1, 'Input path is required').default(''),
    outputPath: z.string().min(1, 'Output path is required').default(''),
});

export const uploadArtifactConfigSchema = z.object({
    endpoint: z.string().min(1, 'Endpoint is required').default(''),
    bucket: z.string().min(1, 'Bucket name is required').default(''),
    accessKey: z.string().min(1, 'Access key is required').default(''),
    secretKey: z.string().min(1, 'Secret key is required').default(''),
    region: z.string().default('us-east-1'),
    sourcePath: z.string().min(1, 'Source path is required').default(''),
    destinationPath: z.string().min(1, 'Destination path is required').default(''),
    useSSL: z.boolean().default(true),
});

export const downloadFileConfigSchema = z.object({
    url: z.string().min(1, 'URL is required').default(''),
    destinationPath: z.string().min(1, 'Destination path is required').default(''),
    filename: z.string().optional(),
});

// ─── Database ────────────────────────────────────────────────────────────────

export const runMigrationConfigSchema = z.object({
    image: z.string().min(1, 'Image is required').default(''),
    command: z.string().min(1, 'Command is required').default(''),
    databaseUrl: z.string().min(1, 'Database URL is required').default(''),
    workdir: z.string().optional(),
});

export const backupVolumeS3ConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    accountId: z.string().min(1, 'AWS account ID is required').default(''),
    bucket: refable(z.string().min(1, 'Bucket name is required')).default(''),
});

// ─── Docker Swarm ─────────────────────────────────────────────────────────────

export const deployStackConfigSchema = z.object({
    stackName: z.string().min(1, 'Stack name is required').default(''),
    composeFilePath: z.string().default('docker-compose.yml'),
    prune: z.boolean().default(false),
});

export const updateServiceConfigSchema = z.object({
    serviceName: z.string().min(1, 'Service name is required').default(''),
    image: z.string().min(1, 'Image is required').default(''),
    tag: z.string().default('latest'),
    forceUpdate: z.boolean().default(false),
});

export const scaleServiceConfigSchema = z.object({
    serviceName: z.string().min(1, 'Service name is required').default(''),
    replicas: z.number().min(0).default(1),
});

// ─── Monitoring ───────────────────────────────────────────────────────────────

export const checkContainerLogsConfigSchema = z.object({
    containerId: refable(z.string().min(1, 'Container is required')).default(''),
    pattern: refable(z.string().min(1, 'Pattern is required')).default(''),
    since: refable(z.string()).default(''),
    timeout: z.number().default(30),
    failIfFound: z.boolean().default(false),
});

// ─── Cache ────────────────────────────────────────────────────────────────────

const cacheRelativePath = (label: string) =>
    z
        .string()
        .min(1, `${label} is required`)
        .refine((v) => !v.startsWith('/'), `${label} must be a relative path`)
        .refine((v) => !v.split('/').some((seg) => seg === '..'), `${label} must not contain '..'`)
        .refine((v) => !/[`$\\|;&<>()\n\r]/.test(v), `${label} contains invalid characters`);

const cacheKeySchema = z
    .string()
    .regex(
        /^[a-zA-Z0-9_\-.]+$/,
        'Cache key must only contain alphanumeric characters, hyphens, underscores or dots',
    );

export const cacheRestoreConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    cachePath: refable(cacheRelativePath('Cache path')).default(''),
    cacheKey: refable(cacheKeySchema).optional(),
});

export const cacheSaveConfigSchema = z.object({
    volumeName: refable(z.string().min(1, 'Volume name is required')).default(''),
    sourcePath: refable(cacheRelativePath('Source path')).default(''),
    cacheKey: refable(cacheKeySchema).optional(),
});

// ─── Git ─────────────────────────────────────────────────────────────────────

export const gitTagConfigSchema = z.object({
    tagName: z.string().min(1, 'Tag name is required').default(''),
    message: z.string().optional(),
    remote: z.string().default('origin'),
});

export const gitCloneExtraConfigSchema = z.object({
    repoUrl: z.string().min(1, 'Repository URL is required').default(''),
    branch: z.string().default('main'),
    targetDir: z.string().min(1, 'Target directory is required').default(''),
    token: z.string().optional(),
});

export const cherryPickCommitConfigSchema = z.object({
    commitHash: refable(z.string().min(1, 'Commit hash is required')).default(''),
    targetBranch: z.string().optional(),
    noCommit: z.boolean().default(false),
    remote: z.string().default('origin'),
});

export const mergeBranchConfigSchema = z.object({
    sourceBranch: refable(z.string().min(1, 'Source branch is required')).default(''),
    targetBranch: z.string().optional(),
    strategy: z.enum(['merge', 'squash']).default('merge'),
    message: z.string().optional(),
    remote: z.string().default('origin'),
    push: z.boolean().default(false),
});

export const generateChangelogConfigSchema = z.object({
    fromTag: refable(z.string()).default(''),
    toRef: refable(z.string()).default('HEAD'),
    outputPath: z.string().default('CHANGELOG.md'),
    format: z.enum(['conventional', 'simple']).default('conventional'),
    append: z.boolean().default(false),
});

export const createReleaseConfigSchema = z.object({
    provider: z.enum(['github', 'gitlab']).default('github'),
    token: z.string().min(1, 'Token is required').default(''),
    owner: z.string().min(1, 'Owner is required').default(''),
    repo: z.string().min(1, 'Repository is required').default(''),
    baseUrl: z.string().default('https://gitlab.com'),
    tagName: refable(z.string().min(1, 'Tag name is required')).default(''),
    targetBranch: z.string().default('main'),
    releaseTitle: refable(z.string()).default(''),
    releaseNotes: z.string().default(''),
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
    timeoutSeconds: z.number().default(300),
    serverUrl: z.string().default('https://sonarcloud.io'),
    organization: z.string().optional(),
    sonarqubeVersion: z.string().default('community'),
    sonarqubePort: z.number().default(9000),
});

// ─── Secrets ─────────────────────────────────────────────────────────────────

export const fetchSecretsConfigSchema = z.object({
    provider: z.enum(['vault', 'doppler', 'env-file']).default('vault'),
    endpoint: z.string().optional(),
    token: z.string().min(1, 'Token is required').default(''),
    secretPath: z.string().min(1, 'Secret path is required').default(''),
    outputAs: z.enum(['env-vars', 'json-file']).default('env-vars'),
});
