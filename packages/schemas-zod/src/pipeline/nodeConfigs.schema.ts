import { z } from 'zod';
import { nodeFieldRefSchema, refAwareString } from './nodeFieldRef.schema.ts';

export const cloneRepositoryConfigSchema = z.object({
    branch: refAwareString().default('main'),
    commitHash: refAwareString().optional(),
});

export const webhookCloneConfigSchema = z.object({
    branchFilter: refAwareString().optional(),
});

export const buildDockerImageConfigSchema = z.object({
    dockerfilePath: refAwareString(z.string().min(1, 'Dockerfile path is required')).default(
        'Dockerfile',
    ),
    dockerfileFilePath: refAwareString().optional(),
});

export const validateDockerfileConfigSchema = z.object({
    dockerfilePath: refAwareString(z.string().min(1, 'Dockerfile path is required')).default(
        'Dockerfile',
    ),
});

export const composeFileConfigSchema = z.object({
    composeFileName: refAwareString(z.string().min(1, 'Compose file name is required')).default(
        'docker-compose.yml',
    ),
    composeFilePath: refAwareString().optional(),
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
    key: refAwareString(z.string().min(1, 'Key is required')),
    value: refAwareString(),
});

export const setEnvVarsConfigSchema = z.object({
    vars: z.array(varEntrySchema).default([]),
});

export const pushToRegistryConfigSchema = z.object({
    registryId: z.string().min(1, 'Registry is required').default(''),
    registryName: refAwareString().default(''),
});

export const pullFromRegistryConfigSchema = z.object({
    registryId: z.string().default('docker-hub'),
    imageName: refAwareString(z.string().min(1, 'Image name is required')).default(''),
});

export const setEnvironmentConfigSchema = z.object({
    environmentId: z.string().min(1, 'Environment is required').default(''),
});

export const sendNotificationConfigSchema = z.object({
    webhookUrl: z
        .union([
            z.url('Webhook URL must be a valid URL').min(1, 'Webhook URL is required'),
            nodeFieldRefSchema,
        ])
        .default(''),
    triggerOn: z.array(z.enum(['success', 'failure', 'always'])).default(['always']),
    message: refAwareString().optional(),
});

export const containerActionConfigSchema = z.object({
    containerId: z.string().min(1, 'Container is required').default(''),
    containerName: refAwareString(),
});

const createContainerPortSchema = z.object({
    hostPort: refAwareString(),
    containerPort: refAwareString(),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
});

const createContainerEnvVarSchema = z.object({
    key: refAwareString(),
    value: refAwareString(),
});

const createContainerVolumeSchema = z.object({
    hostPath: refAwareString(),
    containerPath: refAwareString(),
    readOnly: z.boolean().default(false),
});

export const createContainerConfigSchema = z.object({
    containerName: refAwareString().optional(),
    imageName: refAwareString(),
    restartPolicy: z
        .enum(['no', 'always', 'on-failure', 'unless-stopped'])
        .default('unless-stopped'),
    networkName: refAwareString().optional(),
    advanced: z.boolean().default(false),
    ports: z.array(createContainerPortSchema).default([]),
    envVars: z.array(createContainerEnvVarSchema).default([]),
    volumes: z.array(createContainerVolumeSchema).default([]),
});

export const createNetworkConfigSchema = z.object({
    name: refAwareString(z.string().min(1, 'Network name is required')).default(''),
    driver: refAwareString().default('bridge'),
});

export const createVolumeConfigSchema = z.object({
    name: refAwareString(z.string().min(1, 'Volume name is required')).default(''),
    driver: refAwareString().optional(),
});

// ─── Flow Control ───────────────────────────────────────────────────────────

export const waitForHealthConfigSchema = z.object({
    containerName: refAwareString(z.string().min(1, 'Container name is required')).default(''),
    timeout: z.number().default(60),
    interval: z.number().default(5),
});

export const waitForUrlConfigSchema = z.object({
    url: refAwareString(z.string().min(1, 'URL is required')).default(''),
    expectedStatus: z.number().default(200),
    timeout: z.number().default(60),
    interval: z.number().default(5),
    method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
});

export const waitForPortConfigSchema = z.object({
    host: refAwareString(z.string().min(1, 'Host is required')).default(''),
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
    script: refAwareString(z.string().min(1, 'Script is required')).default(''),
    shell: z.enum(['bash', 'sh']).default('bash'),
    continueOnError: z.boolean().default(false),
});

export const runCommandInContainerConfigSchema = z.object({
    containerName: refAwareString(z.string().min(1, 'Container name is required')).default(''),
    command: refAwareString(z.string().min(1, 'Command is required')).default(''),
    workdir: refAwareString().optional(),
});

export const runTestsConfigSchema = z.object({
    command: refAwareString(z.string().min(1, 'Command is required')).default(''),
    image: refAwareString(z.string().min(1, 'Image is required')).default('node:20-alpine'),
    workdir: refAwareString().optional(),
});

// ─── HTTP / Webhooks ─────────────────────────────────────────────────────────

export const httpRequestConfigSchema = z.object({
    url: refAwareString(z.string().min(1, 'URL is required')).default(''),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('POST'),
    headers: z
        .array(z.object({ id: z.string(), key: refAwareString(), value: refAwareString() }))
        .default([]),
    body: refAwareString().optional(),
    expectedStatus: z.number().default(200),
    continueOnError: z.boolean().default(false),
});

export const updateCommitStatusConfigSchema = z.object({
    provider: z.enum(['github', 'gitlab']).default('github'),
    token: refAwareString(z.string().min(1, 'Token is required')).default(''),
    owner: refAwareString(z.string().min(1, 'Owner is required')).default(''),
    repo: refAwareString(z.string().min(1, 'Repository is required')).default(''),
    sha: refAwareString(z.string().min(1, 'SHA is required')).default(''),
    state: z.enum(['pending', 'success', 'failure', 'error']).default('pending'),
    description: refAwareString().optional(),
    targetUrl: refAwareString().optional(),
    baseUrl: refAwareString().default('https://gitlab.com'),
});

// ─── Image Management ────────────────────────────────────────────────────────

export const tagImageConfigSchema = z.object({
    sourceImage: refAwareString(z.string().min(1, 'Source image is required')).default(''),
    sourceTag: refAwareString().default('latest'),
    targetTag: refAwareString(z.string().min(1, 'Target tag is required')).default(''),
});

export const scanImageConfigSchema = z.object({
    image: refAwareString(z.string().min(1, 'Image is required')).default(''),
    tag: refAwareString().default('latest'),
    trivyVersion: refAwareString().default('canary'),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
    exitOnVulnerabilities: z.boolean().default(true),
});

export const pruneImagesConfigSchema = z.object({
    filter: refAwareString().optional(),
    olderThan: refAwareString().optional(),
    dangling: z.boolean().default(true),
});

// ─── Files & Artifacts ───────────────────────────────────────────────────────

export const templateFileConfigSchema = z.object({
    inputPath: refAwareString(z.string().min(1, 'Input path is required')).default(''),
    outputPath: refAwareString(z.string().min(1, 'Output path is required')).default(''),
});

export const uploadArtifactConfigSchema = z.object({
    endpoint: refAwareString(z.string().min(1, 'Endpoint is required')).default(''),
    bucket: refAwareString(z.string().min(1, 'Bucket is required')).default(''),
    accessKey: refAwareString(z.string().min(1, 'Access key is required')).default(''),
    secretKey: refAwareString(z.string().min(1, 'Secret key is required')).default(''),
    region: refAwareString().default('us-east-1'),
    sourcePath: refAwareString(z.string().min(1, 'Source path is required')).default(''),
    destinationPath: refAwareString(z.string().min(1, 'Destination path is required')).default(''),
    useSSL: z.boolean().default(true),
});

export const downloadFileConfigSchema = z.object({
    url: refAwareString(z.string().min(1, 'URL is required')).default(''),
    destinationPath: refAwareString(z.string().min(1, 'Destination path is required')).default(''),
    filename: refAwareString().optional(),
});

// ─── Database ────────────────────────────────────────────────────────────────

export const runMigrationConfigSchema = z.object({
    image: refAwareString(z.string().min(1, 'Image is required')).default(''),
    command: refAwareString(z.string().min(1, 'Command is required')).default(''),
    databaseUrl: refAwareString(z.string().min(1, 'Database URL is required')).default(''),
    workdir: refAwareString().optional(),
});

export const backupVolumeS3ConfigSchema = z.object({
    volumeName: refAwareString(z.string().min(1, 'Volume name is required')).default(''),
    accountId: refAwareString(z.string().min(1, 'AWS account ID is required')).default(''),
    bucket: refAwareString(z.string().min(1, 'Bucket name is required')).default(''),
});

// ─── Docker Swarm ─────────────────────────────────────────────────────────────

export const deployStackConfigSchema = z.object({
    stackName: refAwareString(z.string().min(1, 'Stack name is required')).default(''),
    composeFilePath: refAwareString().default('docker-compose.yml'),
    prune: z.boolean().default(false),
});

export const updateServiceConfigSchema = z.object({
    serviceName: refAwareString(z.string().min(1, 'Service name is required')).default(''),
    image: refAwareString(z.string().min(1, 'Image is required')).default(''),
    tag: refAwareString().default('latest'),
    forceUpdate: z.boolean().default(false),
});

export const scaleServiceConfigSchema = z.object({
    serviceName: refAwareString(z.string().min(1, 'Service name is required')).default(''),
    replicas: z.number().min(0).default(1),
});

// ─── Monitoring ───────────────────────────────────────────────────────────────

export const checkContainerLogsConfigSchema = z.object({
    containerName: refAwareString(z.string().min(1, 'Container name is required')).default(''),
    pattern: refAwareString(z.string().min(1, 'Pattern is required')).default(''),
    since: refAwareString().optional(),
    timeout: z.number().default(30),
    failIfFound: z.boolean().default(false),
});

// ─── Cache ────────────────────────────────────────────────────────────────────

export const cacheRestoreConfigSchema = z.object({
    volumeName: refAwareString(z.string().min(1, 'Volume name is required')).default(''),
    cachePath: refAwareString(z.string().min(1, 'Cache path is required')).default(''),
    cacheKey: refAwareString().optional(),
});

export const cacheSaveConfigSchema = z.object({
    volumeName: refAwareString(z.string().min(1, 'Volume name is required')).default(''),
    sourcePath: refAwareString(z.string().min(1, 'Source path is required')).default(''),
    cacheKey: refAwareString().optional(),
});

// ─── Git ─────────────────────────────────────────────────────────────────────

export const gitTagConfigSchema = z.object({
    tagName: refAwareString(z.string().min(1, 'Tag name is required')).default(''),
    message: refAwareString().optional(),
    remote: refAwareString().default('origin'),
});

export const gitCloneExtraConfigSchema = z.object({
    repoUrl: refAwareString(z.string().min(1, 'Repository URL is required')).default(''),
    branch: refAwareString().default('main'),
    targetDir: refAwareString(z.string().min(1, 'Target directory is required')).default(''),
    token: refAwareString().optional(),
});

// ─── Secrets ─────────────────────────────────────────────────────────────────

export const fetchSecretsConfigSchema = z.object({
    provider: z.enum(['vault', 'doppler', 'env-file']).default('vault'),
    endpoint: refAwareString().optional(),
    token: refAwareString(z.string().min(1, 'Token is required')).default(''),
    secretPath: refAwareString(z.string().min(1, 'Secret path is required')).default(''),
    outputAs: z.enum(['env-vars', 'json-file']).default('env-vars'),
});
