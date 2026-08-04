import type Docker from 'dockerode';
import type { ContainerCreateOptions, ContainerInspectInfo, EndpointSettings } from 'dockerode';
import { HttpError } from '@nexploy/shared/http-error';
import { ContainerMigrateApi } from '@workspace/schemas-zod/docker/container/containerMigrate.schema';
import {
    ContainerImageTransfer,
    ContainerMigrationResult,
} from '@workspace/typescript-interface/docker/docker.container';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { loadEnvironmentByIdFromAPI } from '@/lib/loadEnvironments';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { logger } from '@/utils/logger';

type RegistryAuth = { username: string; password: string; serveraddress?: string };

type VolumeMount = { name: string; destination: string; readOnly: boolean };

const PREDEFINED_NETWORKS = new Set(['bridge', 'host', 'none']);

async function resolveTargetClient(targetEnvironmentId: string): Promise<Docker> {
    const registered = dockerClientRegistry.getClientSafe(targetEnvironmentId);
    if (registered) return registered;

    const config = await loadEnvironmentByIdFromAPI(targetEnvironmentId);
    if (!config) {
        throw new HttpError(`Target environment not found: ${targetEnvironmentId}.`, 404);
    }

    try {
        const client = await dockerClientRegistry.registerEnvironment(config);
        await stateManagerFactory.initializeEnvironment(targetEnvironmentId);
        return client;
    } catch (err: any) {
        throw new HttpError(`Target environment unavailable: ${config.name}. ${err.message}`, 503);
    }
}

async function pullOnTarget(target: Docker, image: string, auth?: RegistryAuth): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const options: Record<string, unknown> = {};
        if (auth) options.authconfig = auth;

        (target.pull as any)(image, options, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);
            target.modem.followProgress(stream, (progressErr: Error | null) =>
                progressErr ? reject(progressErr) : resolve(),
            );
        });
    });
}

async function streamImageToTarget(source: Docker, target: Docker, image: string): Promise<void> {
    const archive = await source.getImage(image).get();

    await new Promise<void>((resolve, reject) => {
        (target.loadImage as any)(archive, {}, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);
            target.modem.followProgress(stream, (progressErr: Error | null) =>
                progressErr ? reject(progressErr) : resolve(),
            );
        });
    });
}

async function ensureImageOnTarget(
    source: Docker,
    target: Docker,
    image: string,
    auth: RegistryAuth | undefined,
): Promise<ContainerImageTransfer> {
    try {
        await target.getImage(image).inspect();
        return 'present';
    } catch {
        /* image missing on target */
    }

    try {
        await pullOnTarget(target, image, auth);
        return 'pulled';
    } catch (err: any) {
        logger.info({ image, err: err.message }, 'Pull on target failed, falling back to image streaming');
    }

    try {
        await streamImageToTarget(source, target, image);
        await target.getImage(image).inspect();
        return 'streamed';
    } catch (err: any) {
        throw new HttpError(`Could not make image "${image}" available on the target environment: ${err.message}`, 502);
    }
}

async function ensureNetworksOnTarget(
    source: Docker,
    target: Docker,
    info: ContainerInspectInfo,
    warnings: string[],
): Promise<Record<string, EndpointSettings>> {
    const endpoints: Record<string, EndpointSettings> = {};
    const sourceNetworks = info.NetworkSettings.Networks ?? {};

    for (const [name, endpoint] of Object.entries(sourceNetworks)) {
        const aliases = ((endpoint.Aliases ?? []) as string[]).filter((alias) => !info.Id.startsWith(alias));
        const endpointConfig: EndpointSettings = aliases.length > 0 ? ({ Aliases: aliases } as EndpointSettings) : {};

        if (PREDEFINED_NETWORKS.has(name)) {
            endpoints[name] = endpointConfig;
            continue;
        }

        try {
            await target.getNetwork(name).inspect();
            endpoints[name] = endpointConfig;
            continue;
        } catch {
            /* network missing on target */
        }

        try {
            const sourceNetwork = await source.getNetwork(name).inspect();
            await target.createNetwork({
                Name: name,
                Driver: sourceNetwork.Driver,
                Internal: sourceNetwork.Internal,
                Attachable: sourceNetwork.Attachable,
                EnableIPv6: sourceNetwork.EnableIPv6,
                Labels: sourceNetwork.Labels,
            });
            endpoints[name] = endpointConfig;
        } catch (err: any) {
            warnings.push(`Network "${name}" could not be created on the target environment: ${err.message}`);
        }
    }

    return endpoints;
}

function collectVolumeMounts(info: ContainerInspectInfo, warnings: string[]): VolumeMount[] {
    const mounts: VolumeMount[] = [];

    for (const mount of info.Mounts ?? []) {
        if (mount.Type === 'bind') {
            warnings.push(
                `Bind mount "${mount.Source}" is not transferred, the host path must exist on the target environment.`,
            );
            continue;
        }

        if (mount.Type !== 'volume' || !mount.Name) continue;

        mounts.push({ name: mount.Name, destination: mount.Destination, readOnly: mount.RW === false });
    }

    return mounts;
}

function buildCreateOptions(
    info: ContainerInspectInfo,
    endpoints: Record<string, EndpointSettings>,
): ContainerCreateOptions {
    const hostConfig = { ...info.HostConfig } as Record<string, unknown>;
    delete hostConfig.ContainerIDFile;

    if (typeof hostConfig.NetworkMode === 'string' && hostConfig.NetworkMode.startsWith('container:')) {
        hostConfig.NetworkMode = 'bridge';
    }

    const config = info.Config as ContainerInspectInfo['Config'] & { StopSignal?: string; StopTimeout?: number };
    const hasGeneratedHostname = !!config.Hostname && info.Id.startsWith(config.Hostname);
    const [firstEndpointName, firstEndpointConfig] = Object.entries(endpoints)[0] ?? [];

    return {
        name: info.Name.replace(/^\//, ''),
        Image: config.Image,
        Hostname: hasGeneratedHostname ? undefined : config.Hostname,
        Domainname: config.Domainname || undefined,
        User: config.User || undefined,
        Env: config.Env ?? undefined,
        Cmd: config.Cmd ?? undefined,
        Entrypoint: config.Entrypoint ?? undefined,
        WorkingDir: config.WorkingDir || undefined,
        Labels: config.Labels ?? undefined,
        ExposedPorts: config.ExposedPorts ?? undefined,
        Volumes: config.Volumes ?? undefined,
        Tty: config.Tty,
        OpenStdin: config.OpenStdin,
        StdinOnce: config.StdinOnce,
        AttachStdin: config.AttachStdin,
        AttachStdout: config.AttachStdout,
        AttachStderr: config.AttachStderr,
        StopSignal: config.StopSignal,
        StopTimeout: config.StopTimeout,
        Healthcheck: config.Healthcheck,
        HostConfig: hostConfig,
        NetworkingConfig: firstEndpointName
            ? { EndpointsConfig: { [firstEndpointName]: firstEndpointConfig! } }
            : undefined,
    } as ContainerCreateOptions;
}

async function connectRemainingNetworks(
    target: Docker,
    containerId: string,
    endpoints: Record<string, EndpointSettings>,
    warnings: string[],
): Promise<void> {
    const [, ...remaining] = Object.entries(endpoints);

    for (const [name, config] of remaining) {
        try {
            await target.getNetwork(name).connect({ Container: containerId, EndpointConfig: config });
        } catch (err: any) {
            warnings.push(`Container could not be attached to network "${name}": ${err.message}`);
        }
    }
}

async function copyVolumeData(
    sourceContainer: Docker.Container,
    targetContainer: Docker.Container,
    mounts: VolumeMount[],
    warnings: string[],
): Promise<string[]> {
    const migrated: string[] = [];

    for (const mount of mounts) {
        if (mount.readOnly) {
            warnings.push(`Volume "${mount.name}" is mounted read-only, its data was not copied.`);
            continue;
        }

        try {
            const archive = await sourceContainer.getArchive({ path: `${mount.destination}/.` });
            await targetContainer.putArchive(archive, { path: mount.destination });
            migrated.push(mount.name);
        } catch (err: any) {
            warnings.push(`Data of volume "${mount.name}" could not be copied: ${err.message}`);
        }
    }

    return migrated;
}

export async function migrateContainer({
    containerId,
    targetEnvironmentId,
    migrateVolumeData,
    sourceAction,
    startAfterMigration,
    auth,
}: ContainerMigrateApi): Promise<ContainerMigrationResult> {
    const sourceEnvironmentId = getCurrentEnvironmentId();

    if (sourceEnvironmentId === targetEnvironmentId) {
        throw new HttpError('The container already runs on this environment.', 400);
    }

    const source = getCurrentDockerClient();
    const target = await resolveTargetClient(targetEnvironmentId);

    const sourceContainer = source.getContainer(containerId);
    const info = await sourceContainer.inspect();
    const containerName = info.Name.replace(/^\//, '');

    logger.info({ containerId, containerName, sourceEnvironmentId, targetEnvironmentId }, 'Migrating container');

    const warnings: string[] = [];
    const imageTransfer = await ensureImageOnTarget(source, target, info.Config.Image, auth);
    const endpoints = await ensureNetworksOnTarget(source, target, info, warnings);
    const volumeMounts = migrateVolumeData ? collectVolumeMounts(info, warnings) : [];

    const wasRunning = info.State.Running;
    const mustStopSource = wasRunning && (sourceAction !== 'keep' || migrateVolumeData);

    if (mustStopSource) {
        await sourceContainer.stop();
    }

    let targetContainer: Docker.Container;
    try {
        targetContainer = await target.createContainer(buildCreateOptions(info, endpoints));
    } catch (err: any) {
        if (mustStopSource && sourceAction === 'keep') {
            await sourceContainer.start().catch(() => {});
        }
        throw new HttpError(
            `Container "${containerName}" could not be created on the target environment: ${err.message}`,
            502,
        );
    }

    await connectRemainingNetworks(target, targetContainer.id, endpoints, warnings);

    const migratedVolumes = migrateVolumeData
        ? await copyVolumeData(sourceContainer, targetContainer, volumeMounts, warnings)
        : [];

    let started = false;
    if (startAfterMigration) {
        try {
            await targetContainer.start();
            started = true;
        } catch (err: any) {
            warnings.push(`Container was created on the target environment but failed to start: ${err.message}`);
        }
    }

    const targetIsHealthy = !startAfterMigration || started;

    if (sourceAction === 'remove' && !targetIsHealthy) {
        warnings.push('Source container was kept because the migrated container failed to start.');
    } else if (sourceAction === 'remove') {
        try {
            await sourceContainer.remove({ force: true });
        } catch (err: any) {
            warnings.push(`Source container could not be removed: ${err.message}`);
        }
    } else if (sourceAction === 'keep' && wasRunning && mustStopSource) {
        try {
            await sourceContainer.start();
        } catch (err: any) {
            warnings.push(`Source container could not be restarted: ${err.message}`);
        }
    }

    logger.info(
        { containerId, targetContainerId: targetContainer.id, targetEnvironmentId, imageTransfer, warnings },
        'Container migration complete',
    );

    return {
        id: targetContainer.id,
        name: containerName,
        targetEnvironmentId,
        imageTransfer,
        started,
        migratedVolumes,
        warnings,
    };
}
