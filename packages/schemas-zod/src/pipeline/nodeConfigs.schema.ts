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

export const writeEnvFileConfigSchema = z.object({
    useRepositoryEnvVars: z.boolean().default(true),
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
    tag: z.string().optional(),
});

export const setEnvironmentConfigSchema = z.object({
    environmentId: z.string().min(1, 'Environment is required'),
});

export const sendNotificationConfigSchema = z.object({
    webhookUrl: z.url('Webhook URL must be a valid URL').min(1, 'Webhook URL is required'),
    triggerOn: z.array(z.enum(['success', 'failure', 'always'])).default(['always']),
    message: z.string().optional(),
});

export const containerActionConfigSchema = z.object({
    containerId: z.string().min(1, 'Container ID is required'),
    containerName: z.string().optional(),
});

export const pullImageConfigSchema = z.object({
    imageName: z.string().min(1, 'Image name is required'),
});

export const createNetworkConfigSchema = z.object({
    name: z.string().min(1, 'Network name is required'),
    driver: z.string().default('bridge'),
});

export const createVolumeConfigSchema = z.object({
    name: z.string().min(1, 'Volume name is required'),
    driver: z.string().optional(),
});

// ─── Flow Control ───────────────────────────────────────────────────────────

export const waitForHealthConfigSchema = z.object({
    containerName: z.string().min(1, 'Container name is required'),
    timeout: z.number().default(60),
    interval: z.number().default(5),
});

export const waitForUrlConfigSchema = z.object({
    url: z.string().min(1, 'URL is required'),
    expectedStatus: z.number().default(200),
    timeout: z.number().default(60),
    interval: z.number().default(5),
    method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
});

export const waitForPortConfigSchema = z.object({
    host: z.string().min(1, 'Host is required'),
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
    script: z.string().min(1, 'Script is required'),
    shell: z.enum(['bash', 'sh']).default('bash'),
    continueOnError: z.boolean().default(false),
});

export const runCommandInContainerConfigSchema = z.object({
    containerName: z.string().min(1, 'Container name is required'),
    command: z.string().min(1, 'Command is required'),
    workdir: z.string().optional(),
});

export const runTestsConfigSchema = z.object({
    command: z.string().min(1, 'Command is required'),
    image: z.string().min(1, 'Image is required').default('node:20-alpine'),
    workdir: z.string().optional(),
});

// ─── HTTP / Webhooks ─────────────────────────────────────────────────────────

export const httpRequestConfigSchema = z.object({
    url: z.string().min(1, 'URL is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('POST'),
    headers: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).default([]),
    body: z.string().optional(),
    expectedStatus: z.number().default(200),
    continueOnError: z.boolean().default(false),
});

export const updateCommitStatusConfigSchema = z.object({
    provider: z.enum(['github', 'gitlab']).default('github'),
    token: z.string().min(1, 'Token is required'),
    owner: z.string().min(1, 'Owner is required'),
    repo: z.string().min(1, 'Repository is required'),
    sha: z.string().min(1, 'SHA is required'),
    state: z.enum(['pending', 'success', 'failure', 'error']).default('pending'),
    description: z.string().optional(),
    targetUrl: z.string().optional(),
});

// ─── Image Management ────────────────────────────────────────────────────────

export const tagImageConfigSchema = z.object({
    sourceImage: z.string().min(1, 'Source image is required'),
    sourceTag: z.string().default('latest'),
    targetTag: z.string().min(1, 'Target tag is required'),
});

export const scanImageConfigSchema = z.object({
    image: z.string().min(1, 'Image is required'),
    tag: z.string().default('latest'),
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
    inputPath: z.string().min(1, 'Input path is required'),
    outputPath: z.string().min(1, 'Output path is required'),
    variables: z
        .array(z.object({ id: z.string(), key: z.string(), value: z.string() }))
        .default([]),
});

export const uploadArtifactConfigSchema = z.object({
    endpoint: z.string().min(1, 'Endpoint is required'),
    bucket: z.string().min(1, 'Bucket is required'),
    accessKey: z.string().min(1, 'Access key is required'),
    secretKey: z.string().min(1, 'Secret key is required'),
    sourcePath: z.string().min(1, 'Source path is required'),
    destinationPath: z.string().min(1, 'Destination path is required'),
    useSSL: z.boolean().default(true),
});

export const downloadFileConfigSchema = z.object({
    url: z.string().min(1, 'URL is required'),
    destinationPath: z.string().min(1, 'Destination path is required'),
    filename: z.string().optional(),
});

// ─── Database ────────────────────────────────────────────────────────────────

export const runMigrationConfigSchema = z.object({
    image: z.string().min(1, 'Image is required'),
    command: z.string().min(1, 'Command is required'),
    databaseUrl: z.string().min(1, 'Database URL is required'),
    workdir: z.string().optional(),
});

export const backupDatabaseConfigSchema = z.object({
    dbType: z.enum(['postgres', 'mysql']).default('postgres'),
    host: z.string().min(1, 'Host is required'),
    port: z.number().default(5432),
    database: z.string().min(1, 'Database is required'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    outputPath: z.string().min(1, 'Output path is required'),
});

// ─── Docker Swarm ─────────────────────────────────────────────────────────────

export const deployStackConfigSchema = z.object({
    stackName: z.string().min(1, 'Stack name is required'),
    composeFilePath: z.string().default('docker-compose.yml'),
    prune: z.boolean().default(false),
});

export const updateServiceConfigSchema = z.object({
    serviceName: z.string().min(1, 'Service name is required'),
    image: z.string().min(1, 'Image is required'),
    tag: z.string().default('latest'),
    forceUpdate: z.boolean().default(false),
});

export const scaleServiceConfigSchema = z.object({
    serviceName: z.string().min(1, 'Service name is required'),
    replicas: z.number().min(0).default(1),
});

// ─── Monitoring ───────────────────────────────────────────────────────────────

export const checkContainerLogsConfigSchema = z.object({
    containerName: z.string().min(1, 'Container name is required'),
    pattern: z.string().min(1, 'Pattern is required'),
    since: z.string().optional(),
    timeout: z.number().default(30),
    failIfFound: z.boolean().default(false),
});

// ─── Cache ────────────────────────────────────────────────────────────────────

export const cacheRestoreConfigSchema = z.object({
    volumeName: z.string().min(1, 'Volume name is required'),
    cachePath: z.string().min(1, 'Cache path is required'),
    cacheKey: z.string().optional(),
});

export const cacheSaveConfigSchema = z.object({
    volumeName: z.string().min(1, 'Volume name is required'),
    sourcePath: z.string().min(1, 'Source path is required'),
    cacheKey: z.string().optional(),
});

// ─── Git ─────────────────────────────────────────────────────────────────────

export const gitTagConfigSchema = z.object({
    tagName: z.string().min(1, 'Tag name is required'),
    message: z.string().optional(),
    remote: z.string().default('origin'),
});

export const gitCloneExtraConfigSchema = z.object({
    repoUrl: z.string().min(1, 'Repository URL is required'),
    branch: z.string().default('main'),
    targetDir: z.string().min(1, 'Target directory is required'),
    token: z.string().optional(),
});

// ─── Secrets ─────────────────────────────────────────────────────────────────

export const fetchSecretsConfigSchema = z.object({
    provider: z.enum(['vault', 'doppler', 'env-file']).default('vault'),
    endpoint: z.string().optional(),
    token: z.string().min(1, 'Token is required'),
    secretPath: z.string().min(1, 'Secret path is required'),
    outputAs: z.enum(['env-vars', 'json-file']).default('env-vars'),
});
