import { NEXPLOY_ORGANIZATION_LABEL } from '@nexploy/shared/ownership';
import { onContainerPauseAction } from '@/actions/docker/container/containerPause.action';
import { onContainerUnpauseAction } from '@/actions/docker/container/containerUnpause.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRenameAction } from '@/actions/docker/container/containerRename.action';
import { onContainerRestartPolicyAction } from '@/actions/docker/container/containerRestartPolicy.action';
import { onContainerChangeImageAction } from '@/actions/docker/container/containerChangeImage.action';
import { onContainerMigrateAction } from '@/actions/docker/container/containerMigrate.action';
import { onContainerRecreateAction } from '@/actions/docker/container/containerRecreate.action';
import { onDockerRefreshAction } from '@/actions/docker/dockerRefresh.action';
import { onNetworkAction } from '@/actions/docker/network/networkAction.action';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { onSwarmJoinAction } from '@/actions/docker/swarm/join.action';
import { onSwarmLeaveAction } from '@/actions/docker/swarm/leave.action';
import { onSwarmNodeAction } from '@/actions/docker/swarm/nodeAction.action';
import { onCreateServiceAction } from '@/actions/docker/swarm/createService.action';
import { onForceUpdateServiceAction } from '@/actions/docker/swarm/forceUpdateService.action';
import { onRemoveServicesAction } from '@/actions/docker/swarm/removeServices.action';
import { onScaleServiceAction } from '@/actions/docker/swarm/scaleService.action';
import { GET as searchImages } from '@/app/api/docker/images/search/route';
import { GET as saveImages } from '@/app/api/docker/images/save/route';
import { callRoute, type RouteHandler } from '../setup/invoke';
import { mockDocker, mockDockerFallback } from '../setup/dockerMock';
import { ADMIN_ONLY, allowOnly, DEVELOPER_AND_ABOVE, describePermissionMatrix, EVERY_ROLE } from './permissionMatrix';

const ORG_A_CONTAINER = 'container-of-org-a';
const HOST_CONTAINER = 'container-of-the-host';

const ORG_A_CONTAINER_MANAGERS = allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember');

function mockContainerOwnership() {
    mockDockerFallback(() => ({}));

    mockDocker('get', `container/${ORG_A_CONTAINER}`, {
        Config: { Labels: { [NEXPLOY_ORGANIZATION_LABEL]: 'org-org-a' } },
    });
    mockDocker('get', `container/${HOST_CONTAINER}`, { Config: { Labels: {} } });
}

describePermissionMatrix('container lifecycle actions on an organization A container', [
    {
        name: 'onContainerPauseAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerPauseAction({ containerIds: [ORG_A_CONTAINER] }),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerUnpauseAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerUnpauseAction({ containerIds: [ORG_A_CONTAINER] }),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerRestartAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerRestartAction({ containerIds: [ORG_A_CONTAINER] }),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerRenameAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerRenameAction({ containerId: ORG_A_CONTAINER, name: 'renamed' }),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerRestartPolicyAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () =>
            onContainerRestartPolicyAction({
                containerId: ORG_A_CONTAINER,
                policy: 'always',
                maximumRetryCount: 0,
            }),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerChangeImageAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerChangeImageAction({ containerId: ORG_A_CONTAINER, image: 'alpine:3.20' } as never),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerMigrateAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () =>
            onContainerMigrateAction({
                containerId: ORG_A_CONTAINER,
                targetEnvironmentId: 'environment-1',
            } as never),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerRecreateAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerRecreateAction({ containerId: ORG_A_CONTAINER } as never),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
]);

describePermissionMatrix('container lifecycle actions on another organization container', [
    {
        name: 'onContainerPauseAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerPauseAction({ containerIds: [ORG_A_CONTAINER] }),
        expected: ORG_A_CONTAINER_MANAGERS,
    },
    {
        name: 'onContainerRenameAction with a container id that resolves to no owner',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onContainerRenameAction({ containerId: HOST_CONTAINER, name: 'renamed' }),
        expected: DEVELOPER_AND_ABOVE,
    },
]);

describePermissionMatrix('docker host resources', [
    {
        name: 'onDockerRefreshAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onDockerRefreshAction({} as never),
        expected: EVERY_ROLE,
    },
    {
        name: 'onNetworkAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onNetworkAction({ action: 'delete', networkIds: [] }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onVolumeAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onVolumeAction({ action: 'delete', volumeNames: ['tests-volume'] }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/docker/images/search',
        kind: 'route',
        invoke: () =>
            callRoute(searchImages as RouteHandler, {
                url: 'http://localhost:3022/api/docker/images/search?term=alpine',
            }),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/docker/images/save',
        kind: 'route',
        setup: () => {
            mockContainerOwnership();
            mockDocker('post', 'images/save', () => new Response('tar-archive'));
        },
        invoke: () =>
            callRoute(saveImages as RouteHandler, {
                url: 'http://localhost:3022/api/docker/images/save?imageIds=sha256%3Aabc',
            }),
        expected: EVERY_ROLE,
    },
]);

describePermissionMatrix('network pruning', [
    {
        name: 'onNetworkAction (prune)',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onNetworkAction({ action: 'prune', networkIds: [] }),
        expected: ADMIN_ONLY,
    },
]);

describePermissionMatrix('swarm actions', [
    {
        name: 'onSwarmJoinAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onSwarmJoinAction({ joinToken: 'token', remoteAddrs: ['127.0.0.1:2377'] }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onSwarmLeaveAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onSwarmLeaveAction({ force: true }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onSwarmNodeAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onSwarmNodeAction({ nodeId: 'node-1', action: 'drain' }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onCreateServiceAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onCreateServiceAction({ name: 'service-1', image: 'alpine:latest' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onForceUpdateServiceAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onForceUpdateServiceAction({ id: 'service-1' }),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onRemoveServicesAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onRemoveServicesAction({ serviceIds: ['service-1'] } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'onScaleServiceAction',
        kind: 'action',
        setup: mockContainerOwnership,
        invoke: () => onScaleServiceAction({ id: 'service-1', replicas: 2 }),
        expected: ADMIN_ONLY,
    },
]);
