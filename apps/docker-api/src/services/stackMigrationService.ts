import type Docker from 'dockerode';
import type { ContainerInspectInfo, EndpointSettings } from 'dockerode';
import { HttpError } from '@nexploy/shared/http-error';
import { COMPOSE_PROJECT_LABEL } from '@nexploy/shared/ownership';
import { StackMigrateApi } from '@workspace/schemas-zod/docker/composes/stackMigrate.schema';
import {
    StackMigratedContainer,
    StackMigrationResult,
} from '@workspace/typescript-interface/docker/docker.composeStack';
import { getCurrentDockerClient, getCurrentEnvironmentId } from '@/lib/dockerContext';
import { resolveStackOwner } from '@/lib/taskOwnership';
import { StartedTask, TaskContext, runAsTask } from '@/lib/taskRunner';
import {
    VolumeMount,
    buildCreateOptions,
    collectVolumeMounts,
    connectRemainingNetworks,
    copyVolumeData,
    ensureImageOnTarget,
    ensureNetworksOnTarget,
    resolveTargetClient,
} from '@/services/containerMigrationService';
import { stopContainerAndWait } from '@/lib/stopContainer';
import { logger } from '@/utils/logger';

const MIGRATION_STEPS = ['images', 'networks', 'create', 'volumes', 'start', 'source'] as const;

interface StackMember {
    info: ContainerInspectInfo;
    name: string;
    sourceContainer: Docker.Container;
    endpoints: Record<string, EndpointSettings>;
    volumeMounts: VolumeMount[];
    targetContainer?: Docker.Container;
    imageTransfer: StackMigratedContainer['imageTransfer'];
    migratedVolumes: string[];
    started: boolean;
    wasRunning: boolean;
    wasStopped: boolean;
}

async function loadStackMembers(source: Docker, stackName: string): Promise<StackMember[]> {
    const containers = await source.listContainers({
        all: true,
        filters: { label: [`${COMPOSE_PROJECT_LABEL}=${stackName}`] },
    });

    if (containers.length === 0) {
        throw new HttpError(`No container found for the stack "${stackName}".`, 404);
    }

    const sorted = [...containers].sort((a, b) => a.Created - b.Created);

    return Promise.all(
        sorted.map(async (summary) => {
            const sourceContainer = source.getContainer(summary.Id);
            const info = await sourceContainer.inspect();

            return {
                info,
                name: info.Name.replace(/^\//, ''),
                sourceContainer,
                endpoints: {},
                volumeMounts: [],
                imageTransfer: 'present' as const,
                migratedVolumes: [],
                started: false,
                wasRunning: info.State.Running,
                wasStopped: false,
            };
        }),
    );
}

async function rollbackCreatedContainers(members: StackMember[]) {
    for (const member of members) {
        if (member.targetContainer) {
            await member.targetContainer.remove({ force: true }).catch(() => {});
            member.targetContainer = undefined;
        }

        if (member.wasStopped) {
            await member.sourceContainer.start().catch(() => {});
            member.wasStopped = false;
        }
    }
}

interface RunStackMigrationInput extends StackMigrateApi {
    context: TaskContext;
    source: Docker;
    members: StackMember[];
}

async function runStackMigration({
    context,
    source,
    members,
    stackName,
    targetEnvironmentId,
    migrateVolumeData,
    sourceAction,
    startAfterMigration,
    auth,
}: RunStackMigrationInput): Promise<StackMigrationResult> {
    const { step, completeStep, setProgress, warn, assertNotCancelled, lockCancellation } = context;
    const warnings: string[] = [];

    const collectWarning = (message: string) => {
        warnings.push(message);
        warn(message);
    };

    const trackProgress = (done: number) => setProgress((done / members.length) * 100);

    step('images');
    const target = await resolveTargetClient(targetEnvironmentId);

    let processed = 0;
    for (const member of members) {
        member.imageTransfer = await ensureImageOnTarget(source, target, member.info.Config.Image, auth);
        trackProgress(++processed);
        assertNotCancelled();
    }
    completeStep('images');

    step('networks');
    processed = 0;
    for (const member of members) {
        member.endpoints = await ensureNetworksOnTarget(source, target, member.info, collectWarning);
        trackProgress(++processed);
    }
    completeStep('networks');
    assertNotCancelled();

    if (migrateVolumeData) {
        for (const member of members) {
            member.volumeMounts = collectVolumeMounts(member.info, collectWarning);
        }
    }

    step('create');
    lockCancellation();
    processed = 0;

    for (const member of members) {
        if (!member.wasRunning || (sourceAction === 'keep' && !migrateVolumeData)) continue;

        try {
            await stopContainerAndWait(member.sourceContainer, member.name);
            member.wasStopped = true;
        } catch (err: any) {
            member.wasStopped = true;
            await rollbackCreatedContainers(members);
            completeStep('create', 'failed');
            throw err instanceof HttpError
                ? err
                : new HttpError(
                      `The stack "${stackName}" could not be stopped on the source environment: ${err.message}`,
                      502,
                  );
        }
    }

    try {
        for (const member of members) {
            member.targetContainer = await target.createContainer(buildCreateOptions(member.info, member.endpoints));
            await connectRemainingNetworks(target, member.targetContainer.id, member.endpoints, collectWarning);
            trackProgress(++processed);
        }
    } catch (err: any) {
        await rollbackCreatedContainers(members);
        completeStep('create', 'failed');
        throw new HttpError(
            `The stack "${stackName}" could not be created on the target environment: ${err.message}`,
            502,
        );
    }
    completeStep('create');

    step('volumes');
    if (migrateVolumeData) {
        processed = 0;
        for (const member of members) {
            try {
                member.migratedVolumes = await copyVolumeData(
                    member.sourceContainer,
                    member.targetContainer!,
                    member.volumeMounts,
                    collectWarning,
                );
            } catch (err: any) {
                await rollbackCreatedContainers(members);
                completeStep('volumes', 'failed');
                throw err instanceof HttpError
                    ? err
                    : new HttpError(
                          `Volume data of the stack "${stackName}" could not be migrated: ${err.message}`,
                          502,
                      );
            }
            trackProgress(++processed);
        }
    }
    completeStep('volumes', migrateVolumeData ? 'done' : 'skipped');

    step('start');
    if (startAfterMigration) {
        processed = 0;
        for (const member of members) {
            try {
                await member.targetContainer!.start();
                member.started = true;
            } catch (err: any) {
                collectWarning(
                    `"${member.name}" was created on the target environment but failed to start: ${err.message}`,
                );
            }
            trackProgress(++processed);
        }
    }
    completeStep('start', startAfterMigration ? 'done' : 'skipped');

    step('source');
    const stackIsHealthy = !startAfterMigration || members.every((member) => member.started);

    if (sourceAction === 'remove' && !stackIsHealthy) {
        collectWarning('The source stack was kept because some migrated containers failed to start.');
    }

    processed = 0;
    for (const member of members) {
        if (sourceAction === 'remove' && stackIsHealthy) {
            await member.sourceContainer.remove({ force: true }).catch((err: any) => {
                collectWarning(`Source container "${member.name}" could not be removed: ${err.message}`);
            });
        } else if (sourceAction === 'keep' && member.wasStopped) {
            await member.sourceContainer.start().catch((err: any) => {
                collectWarning(`Source container "${member.name}" could not be restarted: ${err.message}`);
            });
        }
        trackProgress(++processed);
    }
    completeStep('source');

    logger.info({ stackName, targetEnvironmentId, containers: members.length, warnings }, 'Stack migration complete');

    return {
        stackName,
        targetEnvironmentId,
        containers: members.map((member) => ({
            id: member.targetContainer!.id,
            name: member.name,
            imageTransfer: member.imageTransfer,
            started: member.started,
            migratedVolumes: member.migratedVolumes,
        })),
        warnings,
    };
}

export async function startStackMigration(input: StackMigrateApi): Promise<StartedTask> {
    const sourceEnvironmentId = getCurrentEnvironmentId();

    if (sourceEnvironmentId === input.targetEnvironmentId) {
        throw new HttpError('The stack already runs on this environment.', 400);
    }

    const source = getCurrentDockerClient();
    const members = await loadStackMembers(source, input.stackName);

    return runAsTask({
        kind: 'stack-migrate',
        subjectName: input.stackName,
        stepKeys: [...MIGRATION_STEPS],
        environmentId: sourceEnvironmentId,
        targetEnvironmentId: input.targetEnvironmentId,
        ownerOrganizationId: await resolveStackOwner(input.stackName),
        cancellable: true,
        run: (context) => runStackMigration({ ...input, context, source, members }),
        resultHref: () => '/docker/containers',
    });
}
