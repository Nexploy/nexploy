import { z } from 'zod';

export const cloneRepositoryConfigSchema = z.object({
    branch: z.string().default('main'),
    commitHash: z.string().optional(),
});

export const webhookCloneConfigSchema = z.object({
    branchFilter: z.string().optional(),
});

export const buildDockerImageConfigSchema = z.object({
    dockerfilePath: z.string().min(1, 'Dockerfile path is required').default('Dockerfile'),
    dockerfileFilePath: z.string().optional(),
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
    webhookUrl: z
        .url('Webhook URL must be a valid URL')
        .min(1, 'Webhook URL is required')
        .default(''),
    triggerOn: z.array(z.enum(['success', 'failure', 'always'])).default(['always']),
    message: z.string().optional(),
});

export const containerActionConfigSchema = z.object({
    containerId: z.string().min(1, 'Container is required').default(''),
    containerName: z.string(),
});

const createContainerPortSchema = z.object({
    hostPort: z.string(),
    containerPort: z.string(),
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
    containerName: z.string().optional(),
    imageName: z.string(),
    restartPolicy: z
        .enum(['no', 'always', 'on-failure', 'unless-stopped'])
        .default('unless-stopped'),
    networkName: z.string().optional(),
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
    containerName: z.string().min(1, 'Container name is required').default(''),
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
    url: z.string().min(1, 'URL is required').default(''),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('POST'),
    headers: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).default([]),
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

// ─── Files & Artifacts ───────────────────────────────────────────────────────

export const templateFileConfigSchema = z.object({
    inputPath: z.string().min(1, 'Input path is required').default(''),
    outputPath: z.string().min(1, 'Output path is required').default(''),
});

export const uploadArtifactConfigSchema = z.object({
    endpoint: z.string().min(1, 'Endpoint is required').default(''),
    bucket: z.string().min(1, 'Bucket is required').default(''),
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
    volumeName: z.string().min(1, 'Volume name is required').default(''),
    accountId: z.string().min(1, 'AWS account ID is required').default(''),
    bucket: z.string().min(1, 'Bucket name is required').default(''),
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
    containerName: z.string().min(1, 'Container name is required').default(''),
    pattern: z.string().min(1, 'Pattern is required').default(''),
    since: z.string().optional(),
    timeout: z.number().default(30),
    failIfFound: z.boolean().default(false),
});

// ─── Cache ────────────────────────────────────────────────────────────────────

export const cacheRestoreConfigSchema = z.object({
    volumeName: z.string().min(1, 'Volume name is required').default(''),
    cachePath: z.string().min(1, 'Cache path is required').default(''),
    cacheKey: z.string().optional(),
});

export const cacheSaveConfigSchema = z.object({
    volumeName: z.string().min(1, 'Volume name is required').default(''),
    sourcePath: z.string().min(1, 'Source path is required').default(''),
    cacheKey: z.string().optional(),
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

// ─── Secrets ─────────────────────────────────────────────────────────────────

export const fetchSecretsConfigSchema = z.object({
    provider: z.enum(['vault', 'doppler', 'env-file']).default('vault'),
    endpoint: z.string().optional(),
    token: z.string().min(1, 'Token is required').default(''),
    secretPath: z.string().min(1, 'Secret path is required').default(''),
    outputAs: z.enum(['env-vars', 'json-file']).default('env-vars'),
});
