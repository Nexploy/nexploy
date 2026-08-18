import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { onRemoveBuild } from '@/actions/repository/builds/removeBuild.action';
import { deleteEnvVariableAction } from '@/actions/repository/deleteEnvVariable.action';
import { saveNodeConfigAction } from '@/actions/repository/pipeline/saveNodeConfig.action';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { teardownWebhookAction } from '@/actions/repository/pipeline/teardownWebhook.action';
import { relinkGitAccountAction } from '@/actions/repository/relinkGitAccount.action';
import { clearCacheAction } from '@/actions/repository/settings/clearCache.action';
import { moveRepositoryToOrganizationAction } from '@/actions/repository/settings/moveRepositoryToOrganization.action';
import { deleteStageAction } from '@/actions/repository/stages/deleteStage.action';
import { onDeleteVersion } from '@/actions/repository/versions/deleteVersion.action';
import { onDeployComposeVersion } from '@/actions/repository/versions/deployComposeVersion.action';
import { onDeployDockerfileVersion } from '@/actions/repository/versions/deployDockerfileVersion.action';
import { createCustomCert } from '@/actions/repository/sslCertificate/createCustomCert.action';
import { createLetsEncryptCert } from '@/actions/repository/sslCertificate/createLetsEncryptCert.action';
import { deleteSslCert } from '@/actions/repository/sslCertificate/deleteSslCert.action';
import { updateCustomCert } from '@/actions/repository/sslCertificate/updateCustomCert.action';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { onGetTokenBuildTasksAction } from '@/actions/inngest/tokenBuildTasks.action';
import { addDomain } from '@/actions/domains/addDomain.action';
import { editDomain } from '@/actions/domains/editDomain.action';
import { deleteDomain } from '@/actions/domains/deleteDomain.action';
import { GET as getBuild } from '@/app/api/repositories/[repositoryId]/builds/[buildId]/route';
import { GET as getNodeLogs } from '@/app/api/repositories/[repositoryId]/builds/[buildId]/nodes/[nodeId]/logs/route';
import { GET as getStageEnv } from '@/app/api/repositories/[repositoryId]/stages/[stageId]/env/route';
import { GET as getStagePipeline } from '@/app/api/repositories/[repositoryId]/stages/[stageId]/pipeline/route';
import { GET as getVersions } from '@/app/api/repositories/[repositoryId]/versions/route';
import { GET as getWebhook } from '@/app/api/repositories/[repositoryId]/webhook/route';
import { GET as getGitBranches } from '@/app/api/git/branches/route';
import { GET as getGitRepositories } from '@/app/api/git/repositories/route';
import { GET as getMultiplexedEvents } from '@/app/api/events/multiplexed/route';
import { callRoute, type RouteHandler } from '../setup/invoke';
import { NEXPLOY_ORGANIZATION_LABEL } from '@nexploy/shared/ownership';
import { mockDocker, mockDockerFallback } from '../setup/dockerMock';
import { allowOnly, DEVELOPER_AND_ABOVE, describePermissionMatrix, EVERY_ROLE } from './permissionMatrix';

const ORG_A_MEMBERS = allowOnly('admin', 'orgOwner', 'orgAdmin', 'orgMember');
const ORG_A_WRITERS = allowOnly('admin', 'orgOwner', 'orgAdmin');
const ORG_A_CONTAINER = 'container-of-org-a';

function mockDomainContainer() {
    mockDockerFallback(() => ({}));
    mockDocker('get', `container/${ORG_A_CONTAINER}`, {
        Config: { Labels: { [NEXPLOY_ORGANIZATION_LABEL]: 'org-org-a' } },
    });
}

describePermissionMatrix('build endpoints', [
    {
        name: 'onCancelBuild',
        kind: 'action',
        invoke: (world) => onCancelBuild({ buildId: world.builds.inOrgA }),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'onRemoveBuild',
        kind: 'action',
        invoke: (world) => onRemoveBuild({ buildId: world.builds.inOrgA }),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'onCancelBuild on another organization build',
        kind: 'action',
        invoke: (world) => onCancelBuild({ buildId: world.builds.inOrgB }),
        expected: allowOnly('admin', 'outsider'),
    },
    {
        name: 'onGetTokenBuildIdAction',
        kind: 'action',
        invoke: (world) => onGetTokenBuildIdAction({ buildId: world.builds.inOrgA, topics: ['logs'] }),
        expected: ORG_A_MEMBERS,
    },
    {
        name: 'onGetTokenBuildTasksAction',
        kind: 'action',
        invoke: () => onGetTokenBuildTasksAction(),
        expected: allowOnly('guest', 'developer', 'admin', 'system', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
    {
        name: 'onDeleteVersion',
        kind: 'action',
        invoke: (world) => onDeleteVersion({ repositoryId: world.repositories.inOrgA, imageTag: 'repo-a:1' } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'onDeployComposeVersion',
        kind: 'action',
        invoke: (world) =>
            onDeployComposeVersion({ repositoryId: world.repositories.inOrgA, imageTag: 'repo-a:1' } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'onDeployDockerfileVersion',
        kind: 'action',
        invoke: (world) =>
            onDeployDockerfileVersion({ repositoryId: world.repositories.inOrgA, imageTag: 'repo-a:1' } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'GET /api/repositories/[repositoryId]/builds/[buildId]',
        kind: 'route',
        invoke: (world) =>
            callRoute(getBuild as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/builds/${world.builds.inOrgA}`,
                params: { repositoryId: world.repositories.inOrgA, buildId: world.builds.inOrgA },
            }),
        expected: ORG_A_MEMBERS,
    },
    {
        name: 'GET /api/repositories/[repositoryId]/builds/[buildId]/nodes/[nodeId]/logs',
        kind: 'route',
        invoke: (world) =>
            callRoute(getNodeLogs as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/builds/${world.builds.inOrgA}/nodes/clone-repository/logs`,
                params: {
                    repositoryId: world.repositories.inOrgA,
                    buildId: world.builds.inOrgA,
                    nodeId: 'clone-repository',
                },
            }),
        expected: ORG_A_MEMBERS,
    },
    {
        name: 'GET /api/repositories/[repositoryId]/versions',
        kind: 'route',
        invoke: (world) =>
            callRoute(getVersions as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/versions`,
                params: { repositoryId: world.repositories.inOrgA },
            }),
        expected: ORG_A_MEMBERS,
    },
]);

describePermissionMatrix('repository configuration endpoints', [
    {
        name: 'deleteEnvVariableAction',
        kind: 'action',
        invoke: (world) => deleteEnvVariableAction({ repositoryId: world.repositories.inOrgA, id: 'env-1' } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'savePipelineAction node config',
        kind: 'action',
        invoke: (world) =>
            saveNodeConfigAction(world.repositories.inOrgA, world.stages.inOrgA, 'clone-repository', {
                branch: 'main',
            }),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'setupWebhookAction',
        kind: 'action',
        invoke: (world) => setupWebhookAction({ repositoryId: world.repositories.inOrgA } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'teardownWebhookAction',
        kind: 'action',
        invoke: (world) => teardownWebhookAction({ repositoryId: world.repositories.inOrgA } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'relinkGitAccountAction',
        kind: 'action',
        invoke: (world) =>
            relinkGitAccountAction(world.repositories.inOrgA, { gitAccountId: 'git-account-1' } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'clearCacheAction',
        kind: 'action',
        invoke: (world) => clearCacheAction({ repositoryId: world.repositories.inOrgA }),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'moveRepositoryToOrganizationAction',
        kind: 'action',
        invoke: (world) =>
            moveRepositoryToOrganizationAction(world.repositories.inOrgA, {
                organizationId: world.orgA.id,
            } as never),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'deleteStageAction',
        kind: 'action',
        invoke: (world) => deleteStageAction({ id: world.stages.inOrgA }),
        expected: ORG_A_WRITERS,
    },
    {
        name: 'GET /api/repositories/[repositoryId]/stages/[stageId]/env',
        kind: 'route',
        invoke: (world) =>
            callRoute(getStageEnv as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/stages/${world.stages.inOrgA}/env`,
                params: { repositoryId: world.repositories.inOrgA, stageId: world.stages.inOrgA },
            }),
        expected: ORG_A_MEMBERS,
    },
    {
        name: 'GET /api/repositories/[repositoryId]/stages/[stageId]/pipeline',
        kind: 'route',
        invoke: (world) =>
            callRoute(getStagePipeline as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/stages/${world.stages.inOrgA}/pipeline`,
                params: { repositoryId: world.repositories.inOrgA, stageId: world.stages.inOrgA },
            }),
        expected: ORG_A_MEMBERS,
    },
    {
        name: 'GET /api/repositories/[repositoryId]/webhook',
        kind: 'route',
        invoke: (world) =>
            callRoute(getWebhook as RouteHandler, {
                url: `http://localhost:3022/api/repositories/${world.repositories.inOrgA}/webhook`,
                params: { repositoryId: world.repositories.inOrgA },
            }),
        expected: ORG_A_MEMBERS,
    },
]);

describePermissionMatrix('SSL and domain endpoints', [
    {
        name: 'createCustomCert',
        kind: 'action',
        invoke: () =>
            createCustomCert({
                name: 'custom',
                domain: 'app.example.test',
                certificate: 'cert',
                privateKey: 'key',
            }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'createLetsEncryptCert',
        kind: 'action',
        invoke: () =>
            createLetsEncryptCert({
                name: 'letsencrypt',
                domain: 'app.example.test',
                email: 'ops@example.test',
                agreedToTos: true,
            }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'updateCustomCert',
        kind: 'action',
        invoke: () =>
            updateCustomCert({
                id: 'certificate-1',
                name: 'custom renamed',
                domain: 'app.example.test',
            }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'deleteSslCert',
        kind: 'action',
        invoke: () => deleteSslCert({ id: 'certificate-1' }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'addDomain on an organization A container',
        kind: 'action',
        setup: mockDomainContainer,
        invoke: () =>
            addDomain({
                domain: { domain: 'app.example.test', containerName: ORG_A_CONTAINER, port: 3000 },
            } as never),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin'),
    },
    {
        name: 'editDomain on an organization A container',
        kind: 'action',
        setup: mockDomainContainer,
        invoke: () =>
            editDomain({
                domain: { domain: 'app.example.test', containerName: ORG_A_CONTAINER, port: 3000 },
            } as never),
        expected: allowOnly('admin', 'orgOwner', 'orgAdmin'),
    },
    {
        name: 'deleteDomain with an unknown domain identifier',
        kind: 'action',
        setup: mockDomainContainer,
        invoke: () => deleteDomain({ domainId: 'unknown-domain' } as never),
        expected: allowOnly('admin'),
    },
]);

describePermissionMatrix('git and event endpoints', [
    {
        name: 'GET /api/git/repositories',
        kind: 'route',
        invoke: () =>
            callRoute(getGitRepositories as RouteHandler, {
                url: 'http://localhost:3022/api/git/repositories?provider=GITHUB&gitAccountId=git-account-1',
            }),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/git/branches',
        kind: 'route',
        invoke: () =>
            callRoute(getGitBranches as RouteHandler, {
                url: 'http://localhost:3022/api/git/branches?provider=GITHUB&repoId=1&owner=nexploy&repoName=repo-a&gitAccountId=git-account-1',
            }),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/events/multiplexed',
        kind: 'route',
        invoke: () =>
            callRoute(getMultiplexedEvents as RouteHandler, {
                url: 'http://localhost:3022/api/events/multiplexed?channels=containers',
            }),
        expected: EVERY_ROLE,
    },
]);
