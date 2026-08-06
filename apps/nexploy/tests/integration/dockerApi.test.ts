import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { onContainerCreateAction } from '@/actions/docker/container/containerCreate.action';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { onImagePullAction } from '@/actions/docker/image/imagePullAction.action';
import { onVolumeCreateAction } from '@/actions/docker/volume/volumeCreate.action';
import { kyDocker } from '@/lib/api/kyDocker';
import { FORBIDDEN_MESSAGE, type ActionResult } from '../setup/invoke';
import { resetDatabase } from '../setup/db';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { loginAs } from '../setup/session';

const REAL_DOCKER = process.env.NEXPLOY_TEST_DOCKER === 'real';

const CONTAINER_NAME = 'nexploy-api-tests-container';
const VOLUME_NAME = 'nexploy-api-tests-volume';

interface DockerContainer {
    id: string;
    name: string;
}

async function listContainers(): Promise<DockerContainer[]> {
    return kyDocker.get('containers').json<DockerContainer[]>();
}

async function findTestContainer(): Promise<DockerContainer | undefined> {
    const containers = await listContainers();

    return containers.find((container) => container.name.replace(/^\//, '') === CONTAINER_NAME);
}

async function waitForTestContainer(shouldExist: boolean): Promise<DockerContainer | undefined> {
    const deadline = Date.now() + 15_000;
    let container = await findTestContainer();

    while (Date.now() < deadline && Boolean(container) !== shouldExist) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        container = await findTestContainer();
    }

    return container;
}

async function removeTestContainer(): Promise<void> {
    const container = await findTestContainer();
    if (!container) return;

    await kyDocker
        .delete('container/remove', { json: { containerIds: [container.id], force: true, removeVolumes: false } })
        .catch(() => undefined);

    await waitForTestContainer(false);
}

describe.runIf(REAL_DOCKER)('docker-api against the throwaway Docker-in-Docker daemon', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
        await removeTestContainer();
    });

    afterAll(async () => {
        await removeTestContainer();
        await resetDatabase();
    });

    it('reaches the isolated docker-api, not the development one', async () => {
        expect(process.env.DOCKER_API_URL).toContain(process.env.TEST_DOCKER_API_PORT ?? '3322');

        const containers = await listContainers();

        expect(Array.isArray(containers)).toBe(true);
    });

    it('creates a real container when an admin asks for it', async () => {
        await loginAs(world.users.admin);

        await onContainerCreateAction({
            name: CONTAINER_NAME,
            image: 'alpine:latest',
            restart: 'no',
            networks: [],
            autoRemove: false,
            ports: [],
            envVars: [],
            volumes: [],
            labels: [],
        });

        expect(await waitForTestContainer(true)).toBeDefined();
    });

    it('creates nothing on the daemon when the caller is denied', async () => {
        await loginAs(world.users.guest);

        const result = (await onContainerCreateAction({
            name: CONTAINER_NAME,
            image: 'alpine:latest',
            restart: 'no',
            networks: [],
            autoRemove: false,
            ports: [],
            envVars: [],
            volumes: [],
            labels: [],
        })) as ActionResult;

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(await findTestContainer()).toBeUndefined();
    });

    it('starts and stops a real container through the guarded actions', async () => {
        await loginAs(world.users.admin);

        await onContainerCreateAction({
            name: CONTAINER_NAME,
            image: 'alpine:latest',
            restart: 'no',
            networks: [],
            autoRemove: false,
            ports: [],
            envVars: [],
            volumes: [],
            labels: [],
        });

        const container = await waitForTestContainer(true);
        expect(container).toBeDefined();

        await onContainerStartAction({ containerIds: [container?.id as string] });
        await onContainerStopAction({ containerIds: [container?.id as string] });
        const removal = (await onContainerRemoveAction({
            containerIds: [container?.id as string],
            force: true,
            removeVolumes: false,
        })) as ActionResult;

        expect(removal.serverError).toBeUndefined();
        expect(await waitForTestContainer(false)).toBeUndefined();
    });

    it('refuses a guest on every container lifecycle action', async () => {
        await loginAs(world.users.admin);

        await onContainerCreateAction({
            name: CONTAINER_NAME,
            image: 'alpine:latest',
            restart: 'no',
            networks: [],
            autoRemove: false,
            ports: [],
            envVars: [],
            volumes: [],
            labels: [],
        });

        const container = await waitForTestContainer(true);
        await loginAs(world.users.guest);

        const start = (await onContainerStartAction({ containerIds: [container?.id as string] })) as ActionResult;
        const remove = (await onContainerRemoveAction({
            containerIds: [container?.id as string],
            force: true,
            removeVolumes: false,
        })) as ActionResult;

        expect(start.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(remove.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(await findTestContainer()).toBeDefined();
    });

    it('refuses a developer on volume creation and creates nothing', async () => {
        await loginAs(world.users.developer);

        const result = (await onVolumeCreateAction({
            name: VOLUME_NAME,
            driverOpts: [],
            labels: [],
        } as never)) as ActionResult;

        const volumes = await kyDocker.get('volumes').json<unknown>();

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(JSON.stringify(volumes)).not.toContain(VOLUME_NAME);
    });

    it('lets a developer pull an image', async () => {
        await loginAs(world.users.developer);

        const result = (await onImagePullAction({ imageName: 'alpine:latest' })) as ActionResult;

        expect(result.serverError).not.toBe(FORBIDDEN_MESSAGE);
    });
});
