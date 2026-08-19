import type Docker from 'dockerode';
import { HttpError } from '@nexploy/shared/http-error';
import { VolumeTransferApi } from '@workspace/schemas-zod/docker/volume/volumeTransfer.schema';
import { VolumeTransferResult, VolumeTransferredVolume } from '@workspace/typescript-interface/docker/docker.volume';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { hidesInfrastructureVolume } from '@/lib/infrastructureGuard';
import { stopContainerAndWait } from '@/lib/stopContainer';
import { StartedTask, TaskContext, runAsTask } from '@/lib/taskRunner';
import { resolveTargetClient } from '@/services/containerMigrationService';
import { ensureImage } from '@/utils/ensureImage';
import { logger } from '@/utils/logger';

const TRANSFER_STEPS = ['transferPrepare', 'transferStop', 'transferCopy', 'transferRestart'] as const;
const HELPER_IMAGE = 'alpine';
const HELPER_MOUNT_PATH = '/nexploy-volume';

interface VolumePlan {
    name: string;
    created: boolean;
    overwritten: boolean;
    sourceContainers: Docker.ContainerInfo[];
    targetContainers: Docker.ContainerInfo[];
}

interface StoppedContainer {
    client: Docker;
    id: string;
    name: string;
    volumeName: string;
}

function containerName(info: Docker.ContainerInfo): string {
    return info.Names?.[0]?.replace(/^\//, '') ?? info.Id.slice(0, 12);
}

async function listContainersUsingVolume(client: Docker, volumeName: string): Promise<Docker.ContainerInfo[]> {
    return client.listContainers({ all: true, filters: { volume: [volumeName] } });
}

async function volumeExists(client: Docker, volumeName: string): Promise<boolean> {
    try {
        await client.getVolume(volumeName).inspect();
        return true;
    } catch (err: any) {
        if (err?.statusCode === 404) return false;
        throw err;
    }
}

async function runHelper(client: Docker, volumeName: string, script: string, readOnly: boolean): Promise<number> {
    const container = await client.createContainer({
        Image: HELPER_IMAGE,
        Cmd: ['sh', '-c', script],
        HostConfig: {
            Binds: [`${volumeName}:${HELPER_MOUNT_PATH}${readOnly ? ':ro' : ''}`],
            AutoRemove: false,
        },
    });

    try {
        await container.start();
        const { StatusCode } = await container.wait();
        return StatusCode;
    } finally {
        container.remove({ force: true }).catch(() => {});
    }
}

async function volumeIsEmpty(client: Docker, volumeName: string): Promise<boolean> {
    const status = await runHelper(client, volumeName, `[ -z "$(ls -A ${HELPER_MOUNT_PATH})" ]`, true);
    return status === 0;
}

async function wipeVolume(client: Docker, volumeName: string): Promise<void> {
    const script = `rm -rf ${HELPER_MOUNT_PATH}/..?* ${HELPER_MOUNT_PATH}/.[!.]* ${HELPER_MOUNT_PATH}/*`;
    const status = await runHelper(client, volumeName, `${script} || true`, false);

    if (status !== 0) {
        throw new HttpError(`Volume "${volumeName}" could not be emptied on the target environment.`, 502);
    }
}

async function createMountedHelper(client: Docker, volumeName: string, readOnly: boolean): Promise<Docker.Container> {
    const container = await client.createContainer({
        Image: HELPER_IMAGE,
        Cmd: ['sleep', '86400'],
        HostConfig: {
            Binds: [`${volumeName}:${HELPER_MOUNT_PATH}${readOnly ? ':ro' : ''}`],
            AutoRemove: false,
        },
    });

    await container.start();

    return container;
}

async function streamVolumeData(source: Docker, target: Docker, volumeName: string): Promise<void> {
    const sourceHelper = await createMountedHelper(source, volumeName, true);
    let targetHelper: Docker.Container | undefined;

    try {
        targetHelper = await createMountedHelper(target, volumeName, false);

        const archive = await sourceHelper.getArchive({ path: `${HELPER_MOUNT_PATH}/.` });

        const archiveFailure = new Promise<never>((_, reject) => {
            archive.on('error', reject);
        });

        await Promise.race([targetHelper.putArchive(archive, { path: HELPER_MOUNT_PATH }), archiveFailure]);
    } finally {
        sourceHelper.remove({ force: true }).catch(() => {});
        targetHelper?.remove({ force: true }).catch(() => {});
    }
}

async function buildPlans(source: Docker, target: Docker, volumeNames: string[]): Promise<VolumePlan[]> {
    const plans: VolumePlan[] = [];

    for (const name of volumeNames) {
        if (hidesInfrastructureVolume(name)) {
            throw new HttpError(`Volume "${name}" not found.`, 404);
        }

        if (!(await volumeExists(source, name))) {
            throw new HttpError(`Volume "${name}" does not exist on the source environment.`, 404);
        }

        plans.push({
            name,
            created: false,
            overwritten: false,
            sourceContainers: await listContainersUsingVolume(source, name),
            targetContainers: await listContainersUsingVolume(target, name),
        });
    }

    return plans;
}

async function prepareTargetVolumes(target: Docker, plans: VolumePlan[], overwrite: boolean): Promise<void> {
    for (const plan of plans) {
        if (!(await volumeExists(target, plan.name))) {
            await target.createVolume({ Name: plan.name });
            plan.created = true;
            continue;
        }

        if (await volumeIsEmpty(target, plan.name)) continue;

        if (!overwrite) {
            throw new HttpError(
                `Volume "${plan.name}" already contains data on the target environment. Enable overwriting to replace it.`,
                409,
            );
        }

        plan.overwritten = true;
    }
}

function assertNothingRunning(plans: VolumePlan[]): void {
    const running = plans.flatMap((plan) =>
        [...plan.sourceContainers, ...plan.targetContainers]
            .filter((info) => info.State === 'running')
            .map((info) => containerName(info)),
    );

    if (running.length > 0) {
        throw new HttpError(
            `These containers are still using the selected volumes and must be stopped first: ${[...new Set(running)].join(', ')}.`,
            409,
        );
    }
}

async function stopVolumeUsers(
    source: Docker,
    target: Docker,
    plans: VolumePlan[],
    stopMode: VolumeTransferApi['stopMode'],
): Promise<StoppedContainer[]> {
    if (stopMode === 'none') {
        assertNothingRunning(plans);
        return [];
    }

    const stopped: StoppedContainer[] = [];

    for (const plan of plans) {
        const entries: { client: Docker; info: Docker.ContainerInfo }[] = plan.targetContainers.map((info) => ({
            client: target,
            info,
        }));

        if (stopMode === 'both') {
            entries.push(...plan.sourceContainers.map((info) => ({ client: source, info })));
        }

        for (const { client, info } of entries) {
            if (info.State !== 'running') continue;
            if (stopped.some((entry) => entry.id === info.Id)) continue;

            const name = containerName(info);
            await stopContainerAndWait(client.getContainer(info.Id), name);
            stopped.push({ client, id: info.Id, name, volumeName: plan.name });
        }
    }

    return stopped;
}

async function restartStoppedContainers(stopped: StoppedContainer[], warn: (message: string) => void): Promise<void> {
    for (const entry of stopped) {
        try {
            await entry.client.getContainer(entry.id).start();
        } catch (err: any) {
            warn(`Container "${entry.name}" could not be restarted: ${err.message}`);
        }
    }
}

interface RunVolumeTransferInput extends VolumeTransferApi {
    context: TaskContext;
    source: Docker;
}

async function runVolumeTransfer({
    context,
    source,
    volumeNames,
    targetEnvironmentId,
    overwrite,
    stopMode,
}: RunVolumeTransferInput): Promise<VolumeTransferResult> {
    const { step, completeStep, setProgress, warn, assertNotCancelled, lockCancellation } = context;
    const warnings: string[] = [];

    const collectWarning = (message: string) => {
        warnings.push(message);
        warn(message);
    };

    step('transferPrepare');
    const target = await resolveTargetClient(targetEnvironmentId);
    const plans = await buildPlans(source, target, volumeNames);

    await ensureImage(source, HELPER_IMAGE);
    await ensureImage(target, HELPER_IMAGE);
    await prepareTargetVolumes(target, plans, overwrite);
    completeStep('transferPrepare');
    assertNotCancelled();

    step('transferStop');
    lockCancellation();
    const stopped = await stopVolumeUsers(source, target, plans, stopMode);
    completeStep('transferStop', stopMode === 'none' ? 'skipped' : 'done');

    step('transferCopy');
    let processed = 0;

    for (const plan of plans) {
        try {
            if (plan.overwritten) await wipeVolume(target, plan.name);
            await streamVolumeData(source, target, plan.name);
        } catch (err: any) {
            await restartStoppedContainers(stopped, collectWarning);
            completeStep('transferCopy', 'failed');
            throw err instanceof HttpError
                ? err
                : new HttpError(`Data of volume "${plan.name}" could not be copied: ${err.message}.`, 502);
        }

        setProgress((++processed / plans.length) * 100);
    }
    completeStep('transferCopy');

    step('transferRestart');
    await restartStoppedContainers(stopped, collectWarning);
    completeStep('transferRestart', stopped.length > 0 ? 'done' : 'skipped');

    const volumes: VolumeTransferredVolume[] = plans.map((plan) => ({
        name: plan.name,
        created: plan.created,
        overwritten: plan.overwritten,
        stoppedContainers: stopped.filter((entry) => entry.volumeName === plan.name).map((entry) => entry.name),
    }));

    logger.info({ targetEnvironmentId, volumes: volumes.length, warnings }, 'Volume transfer complete');

    return { targetEnvironmentId, volumes, warnings };
}

export async function startVolumeTransfer(input: VolumeTransferApi): Promise<StartedTask> {
    const sourceEnvironmentId = getCurrentEnvironmentId();

    if (sourceEnvironmentId === input.targetEnvironmentId) {
        throw new HttpError('The volumes already live on this environment.', 400);
    }

    const source = getCurrentDockerClient();

    return runAsTask({
        kind: 'volume-transfer',
        subjectName: input.volumeNames.join(', '),
        stepKeys: [...TRANSFER_STEPS],
        environmentId: sourceEnvironmentId,
        targetEnvironmentId: input.targetEnvironmentId,
        cancellable: true,
        run: (context) => runVolumeTransfer({ ...input, context, source }),
        resultHref: () => '/docker/volumes',
    });
}
