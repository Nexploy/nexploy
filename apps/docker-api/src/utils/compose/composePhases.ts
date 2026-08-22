import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import { logger } from '@/utils/logger';
import { docker } from '@/utils/dockerClient';
import { discoverComposeFiles, normalizeComposeProject } from '@/utils/compose/composeNormalizer';
import { getTransformationSummary, transformBindMountsForRemote } from '@/utils/compose/composeVolumeTransformer';
import type { ComposeContent, ComposeService } from '@workspace/typescript-interface/docker/docker.compose.build';
import type { VolumeTransformationResult } from '@workspace/typescript-interface/docker/docker.compose.volume';

export const PROCESSED_COMPOSE_FILENAME = '.nexploy-compose-processed.yml';

export function writeEnvFile(workDir: string, envVars: Record<string, string>): string {
    const envFilePath = path.join(workDir, '.env');
    const envContent = Object.entries(envVars)
        .map(([key, value]) => {
            const escapedValue =
                value.includes('\n') || value.includes('"') || value.includes("'")
                    ? `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
                    : value;
            return `${key}=${escapedValue}`;
        })
        .join('\n');

    fs.writeFileSync(envFilePath, envContent, 'utf8');
    return envFilePath;
}

export function cleanupEnvFile(workDir: string): void {
    const envFilePath = path.join(workDir, '.env');
    try {
        if (fs.existsSync(envFilePath)) {
            fs.unlinkSync(envFilePath);
        }
    } catch (error) {
        logger.warn({ error, envFilePath }, 'Failed to cleanup .env file');
    }
}

export function ensureEnvIgnoredInBuildContext(workDir: string): void {
    const dockerignorePath = path.join(workDir, '.dockerignore');
    const requiredEntries = ['.env', '.env.*'];

    let existing = '';
    try {
        if (fs.existsSync(dockerignorePath)) {
            existing = fs.readFileSync(dockerignorePath, 'utf8');
        }
    } catch (error) {
        logger.warn({ error, dockerignorePath }, 'Failed to read existing .dockerignore');
        return;
    }

    const existingLines = new Set(existing.split('\n').map((line) => line.trim()));
    const missingEntries = requiredEntries.filter((entry) => !existingLines.has(entry));

    if (missingEntries.length === 0) {
        return;
    }

    try {
        const separator = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
        fs.writeFileSync(dockerignorePath, `${existing}${separator}${missingEntries.join('\n')}\n`, 'utf8');
    } catch (error) {
        logger.warn({ error, dockerignorePath }, 'Failed to update .dockerignore');
    }
}

export function parseCommandArgs(command: string): string[] {
    const args: string[] = [];
    let current = '';
    let quote: '"' | "'" | null = null;
    let hasContent = false;

    for (let index = 0; index < command.length; index++) {
        const char = command[index];

        if (quote) {
            if (char === quote) {
                quote = null;
                continue;
            }
            if (quote === '"' && char === '\\' && index + 1 < command.length) {
                current += command[++index];
                hasContent = true;
                continue;
            }
            current += char;
            hasContent = true;
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            hasContent = true;
            continue;
        }

        if (char === '\\' && index + 1 < command.length) {
            current += command[++index];
            hasContent = true;
            continue;
        }

        if (/\s/.test(char)) {
            if (hasContent) {
                args.push(current);
                current = '';
                hasContent = false;
            }
            continue;
        }

        current += char;
        hasContent = true;
    }

    if (quote) {
        throw new Error(`Unbalanced ${quote} quote in command: ${command}`);
    }

    if (hasContent) {
        args.push(current);
    }

    return args;
}

export function mergeComposeLabels(
    existing: Record<string, string> | string[] | undefined,
    injected: Record<string, string>,
): Record<string, string> | string[] {
    if (Array.isArray(existing)) {
        const injectedKeys = new Set(Object.keys(injected));
        const kept = existing.filter((entry) => !injectedKeys.has(String(entry).split('=')[0]));

        return [...kept, ...Object.entries(injected).map(([key, value]) => `${key}=${value}`)];
    }

    return { ...(existing ?? {}), ...injected };
}

export function applyComposeLabels(service: ComposeService, labels: Record<string, string>): void {
    service.labels = mergeComposeLabels(service.labels as Record<string, string> | string[] | undefined, labels);

    if (typeof service.build === 'string') {
        service.build = { context: service.build, labels: { ...labels } };
        return;
    }

    if (service.build) {
        service.build.labels = mergeComposeLabels(service.build.labels, labels);
    }
}

export interface PreprocessComposeOptions {
    workDir: string;
    projectName: string;
    composePath: string;
    envVars: Record<string, string>;
    dockerEnv: Record<string, string>;
    labels?: Record<string, string>;
    profiles?: string[];
    isRemoteEnvironment: boolean;
    sendLog: (message: string) => void;
    signal?: AbortSignal;
}

export interface PreprocessComposeResult {
    composeContent: ComposeContent;
    composeDir: string;
    processedComposeFile: string;
    servicesToBuild: string[];
    servicesToPull: string[];
    volumeTransformResult: VolumeTransformationResult | null;
}

export async function preprocessComposeProject({
    workDir,
    projectName,
    composePath,
    envVars,
    dockerEnv,
    labels,
    profiles,
    isRemoteEnvironment,
    sendLog,
    signal,
}: PreprocessComposeOptions): Promise<PreprocessComposeResult> {
    const composeFilePath = path.join(workDir, composePath);
    const composeDir = path.dirname(composeFilePath);

    if (!fs.existsSync(composeFilePath)) {
        throw new Error(`Compose file not found: ${composePath}`);
    }

    ensureEnvIgnoredInBuildContext(workDir);

    if (Object.keys(envVars).length > 0) {
        writeEnvFile(composeDir, envVars);
        sendLog(`Writing ${Object.keys(envVars).length} environment variable(s) to .env file...`);
    }

    const composeFiles = discoverComposeFiles(composeFilePath);

    if (composeFiles.length > 1) {
        sendLog(
            `Merging override file(s): ${composeFiles
                .slice(1)
                .map((file) => path.basename(file))
                .join(', ')}`,
        );
    }

    const normalized = await normalizeComposeProject({
        composeFiles,
        projectDirectory: composeDir,
        projectName,
        envVars,
        dockerEnv,
        profiles,
        signal,
    });

    for (const warning of normalized.warnings) {
        sendLog(warning);
    }

    let composeContent = normalized.composeContent;
    let volumeTransformResult: VolumeTransformationResult | null = null;

    if (isRemoteEnvironment) {
        sendLog('Remote Docker environment detected - transforming bind mounts...');

        volumeTransformResult = transformBindMountsForRemote(composeContent, composeDir, projectName);

        for (const warning of volumeTransformResult.warnings) {
            sendLog(`WARNING: ${warning}`);
        }

        for (const line of getTransformationSummary(volumeTransformResult)) {
            sendLog(line);
        }

        composeContent = volumeTransformResult.modifiedComposeContent as ComposeContent;

        for (const [serviceName, dockerfileContent] of volumeTransformResult.generatedDockerfiles) {
            const dockerfilePath = path.join(composeDir, `.nexploy-${serviceName}.Dockerfile`);
            fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf8');
            sendLog(`Generated Dockerfile for service: ${serviceName}`);
        }

        if (volumeTransformResult.volumesToCreate.length > 0) {
            sendLog(`Creating ${volumeTransformResult.volumesToCreate.length} named volume(s)...`);
            for (const volumeName of volumeTransformResult.volumesToCreate) {
                try {
                    await docker.createVolume({ Name: volumeName });
                    sendLog(`  Created volume: ${volumeName}`);
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    if (!errorMessage.includes('already exists')) {
                        throw err;
                    }
                    sendLog(`  Volume exists: ${volumeName}`);
                }
            }
        }

        if (volumeTransformResult.transformations.length > 0) {
            sendLog('Bind mount transformation complete');
        }
    }

    if (labels && Object.keys(labels).length > 0) {
        for (const service of Object.values(composeContent.services || {})) {
            applyComposeLabels(service, labels);
        }
    }

    const processedComposeFile = path.join(composeDir, PROCESSED_COMPOSE_FILENAME);
    fs.writeFileSync(processedComposeFile, yaml.stringify(composeContent), 'utf8');

    const servicesToBuild = Object.entries(composeContent.services || {})
        .filter(([, s]) => !!s.build)
        .map(([name]) => name);

    const servicesToPull = Object.entries(composeContent.services || {})
        .filter(([, s]) => s.image && !s.build)
        .map(([name]) => name);

    return {
        composeContent,
        composeDir,
        processedComposeFile,
        servicesToBuild,
        servicesToPull,
        volumeTransformResult,
    };
}

export interface UnbuildableService {
    serviceName: string;
    hint?: string;
}

export function findUnbuildableServices(composeContent: ComposeContent): UnbuildableService[] {
    return Object.entries(composeContent.services || {})
        .filter(([, service]) => !service?.build && !service?.image)
        .map(([serviceName, service]) => {
            if (Array.isArray(service?.profiles) && service.profiles.length > 0) {
                return {
                    serviceName,
                    hint: `it is gated behind the profile(s) ${service.profiles.join(', ')} — enable the profile or declare "build" or "image"`,
                };
            }

            return { serviceName };
        });
}

function hasExplicitTag(imageReference: string): boolean {
    const lastSlash = imageReference.lastIndexOf('/');
    return imageReference.indexOf(':', lastSlash + 1) !== -1;
}

export function resolveBuiltImageReferences(
    composeContent: ComposeContent,
    projectName: string,
    servicesToBuild: string[],
    sendLog: (message: string) => void,
): void {
    for (const serviceName of servicesToBuild) {
        const service = composeContent.services![serviceName];
        const builtRef = service.image
            ? hasExplicitTag(service.image)
                ? service.image
                : `${service.image}:latest`
            : `${projectName}-${serviceName}:latest`;

        service.image = builtRef;
        delete (service as Record<string, unknown>).build;

        sendLog(`  ${serviceName} → ${builtRef}`);
    }
}

export async function publishRemoteServicePorts(
    composeContent: ComposeContent,
    sendLog: (message: string) => void,
): Promise<boolean> {
    let portsAdded = false;

    for (const [serviceName, service] of Object.entries(composeContent.services || {})) {
        const servicePorts = service.ports as unknown[] | undefined;
        if (servicePorts && servicePorts.length > 0) {
            continue;
        }

        const imageName = service.image;
        if (!imageName) {
            continue;
        }

        try {
            const imageInfo = await docker.getImage(imageName).inspect();
            const exposedPorts = Object.keys(imageInfo.Config?.ExposedPorts || {});
            if (exposedPorts.length > 0) {
                const portMappings = exposedPorts.map((exposed) => {
                    const [port, protocol] = exposed.split('/');
                    return protocol && protocol !== 'tcp' ? `0:${port}/${protocol}` : `0:${port}`;
                });
                (service as Record<string, unknown>).ports = portMappings;
                sendLog(`  Added port mappings for service ${serviceName}: ${portMappings.join(', ')}`);
                portsAdded = true;
            }
        } catch {
            sendLog(`  Warning: Could not inspect image for service ${serviceName} to determine ports`);
        }
    }

    return portsAdded;
}

export function cleanupGeneratedDockerfiles(composeDir: string, serviceNames: Iterable<string>): void {
    for (const serviceName of serviceNames) {
        const dockerfilePath = path.join(composeDir, `.nexploy-${serviceName}.Dockerfile`);
        try {
            if (fs.existsSync(dockerfilePath)) {
                fs.unlinkSync(dockerfilePath);
            }
        } catch (error) {
            logger.warn({ path: dockerfilePath, error }, 'Failed to cleanup generated Dockerfile');
        }
    }
}

export function cleanupProcessedComposeFile(composeFile: string): void {
    try {
        if (fs.existsSync(composeFile) && path.basename(composeFile) === PROCESSED_COMPOSE_FILENAME) {
            fs.unlinkSync(composeFile);
        }
    } catch (error) {
        logger.warn({ path: composeFile, error }, 'Failed to cleanup processed compose file');
    }
}
