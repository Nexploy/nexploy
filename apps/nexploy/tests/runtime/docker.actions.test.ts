import { beforeEach, describe, expect, it } from 'vitest';
import { NEXPLOY_ORGANIZATION_LABEL } from '@nexploy/shared/ownership';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { onContainerCreateAction } from '@/actions/docker/container/containerCreate.action';
import { onImageAction } from '@/actions/docker/image/imageAction.action';
import { onImagePullAction } from '@/actions/docker/image/imagePullAction.action';
import { onNetworkCreateAction } from '@/actions/docker/network/networkCreate.action';
import { onVolumeCreateAction } from '@/actions/docker/volume/volumeCreate.action';
import { onInitSwarmAction } from '@/actions/docker/swarm/init.action';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { dockerCalls, mockDocker, mockDockerFallback } from '../setup/dockerMock';
import { allowOnly, describePermissionMatrix } from './permissionMatrix';
import { loginAs } from '../setup/session';
import { resetDatabase } from '../setup/db';
import { seedWorld } from '../setup/fixtures';
import { FORBIDDEN_MESSAGE, type ActionResult } from '../setup/invoke';

const ORG_A_CONTAINER = 'container-of-org-a';
const HOST_CONTAINER = 'container-of-the-host';

function mockContainerOwnership() {
    mockDockerFallback(() => ({}));

    mockDocker('get', `container/${ORG_A_CONTAINER}`, {
        Config: { Labels: { [NEXPLOY_ORGANIZATION_LABEL]: 'org-org-a' } },
    });
    mockDocker('get', `container/${HOST_CONTAINER}`, { Config: { Labels: {} } });
}

describePermissionMatrix('docker container actions on an organization A container', [
    {
        name: 'onContainerStartAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerStartAction({ containerIds: [ORG_A_CONTAINER] }),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember'),
    },
    {
        name: 'onContainerStopAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerStopAction({ containerIds: [ORG_A_CONTAINER] }),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember'),
    },
    {
        name: 'onContainerRemoveAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerRemoveAction({ containerIds: [ORG_A_CONTAINER] } as never),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin'),
    },
]);

describePermissionMatrix('docker container actions on a host-owned container', [
    {
        name: 'onContainerStartAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerStartAction({ containerIds: [HOST_CONTAINER] }),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
    {
        name: 'onContainerRemoveAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerRemoveAction({ containerIds: [HOST_CONTAINER] } as never),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
]);

describePermissionMatrix('docker host-level actions', [
    {
        name: 'onContainerCreateAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () =>
            onContainerCreateAction({
                name: 'created-by-tests',
                image: 'alpine:latest',
            } as never),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
    {
        name: 'onImagePullAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onImagePullAction({ imageName: 'alpine:latest' }),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
    {
        name: 'onImageAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onImageAction({ action: 'delete', force: false, imageIds: ['sha256:abc'] }),
        expected: allowOnly('admin'),
    },
    {
        name: 'onNetworkCreateAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onNetworkCreateAction({ name: 'tests-network' } as never),
        expected: allowOnly('admin'),
    },
    {
        name: 'onVolumeCreateAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onVolumeCreateAction({ name: 'tests-volume' } as never),
        expected: allowOnly('admin'),
    },
    {
        name: 'onInitSwarmAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onInitSwarmAction({} as never),
        expected: allowOnly('admin'),
    },
    {
        name: 'onSwarmRefreshAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onSwarmRefreshAction({} as never),
        expected: allowOnly('developer', 'admin', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider', 'guest'),
    },
]);

describe('docker action effects', () => {
    beforeEach(async () => {
        await resetDatabase();
        await seedWorld();
        mockContainerOwnership();
    });

    it('forwards an allowed container start to docker-api', async () => {
        await loginAs({
            id: 'user-admin',
            email: 'admin@nexploy.test',
            name: 'admin',
            role: 'admin',
            organizationId: null,
            orgRole: null,
        });

        await onContainerStartAction({ containerIds: [ORG_A_CONTAINER] });

        expect(dockerCalls).toContainEqual(
            expect.objectContaining({
                method: 'post',
                path: 'container/start',
                options: { json: { containerIds: [ORG_A_CONTAINER] } },
            }),
        );
    });

    it('never reaches docker-api when the caller is denied', async () => {
        await loginAs({
            id: 'user-guest',
            email: 'guest@nexploy.test',
            name: 'guest',
            role: 'guest',
            organizationId: null,
            orgRole: null,
        });

        const result = (await onContainerStartAction({ containerIds: [ORG_A_CONTAINER] })) as ActionResult;

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(dockerCalls.filter((call) => call.method === 'post')).toEqual([]);
    });

    it('treats a container with no resolvable owner as host-owned, so the global role decides', async () => {
        await loginAs({
            id: 'user-org-member',
            email: 'org-member@nexploy.test',
            name: 'org-member',
            role: 'developer',
            organizationId: 'org-org-a',
            orgRole: 'member',
        });

        const result = (await onContainerStartAction({ containerIds: ['unknown-container'] })) as ActionResult;

        expect(result.serverError).not.toBe(FORBIDDEN_MESSAGE);
        expect(dockerCalls).toContainEqual(
            expect.objectContaining({
                method: 'post',
                path: 'container/start',
            }),
        );
    });

    it('denies a mixed batch as soon as one container belongs to another organization', async () => {
        await loginAs({
            id: 'user-outsider',
            email: 'outsider@nexploy.test',
            name: 'outsider',
            role: 'developer',
            organizationId: 'org-org-b',
            orgRole: 'owner',
        });

        const result = (await onContainerStartAction({
            containerIds: [HOST_CONTAINER, ORG_A_CONTAINER],
        })) as ActionResult;

        expect(result.serverError).toBe(FORBIDDEN_MESSAGE);
        expect(dockerCalls.filter((call) => call.method === 'post')).toEqual([]);
    });
});
