import { createEnvironmentAction } from '@/actions/environment/createEnvironment.action';
import { deleteEnvironmentAction } from '@/actions/environment/deleteEnvironment.action';
import { setDefaultEnvironmentAction } from '@/actions/environment/setDefaultEnvironment.action';
import { updateEnvironmentAction } from '@/actions/environment/updateEnvironment.action';
import { updateEnvironmentProtectionAction } from '@/actions/environment/updateEnvironmentProtection.action';
import { createRegistryAction } from '@/actions/registry/createRegistry.action';
import { deleteRegistryAction } from '@/actions/registry/deleteRegistry.action';
import { updateRegistryAction } from '@/actions/registry/updateRegistry.action';
import { mirrorImageAction } from '@/actions/registry/mirrorImage.action';
import { deleteGitProviderAction } from '@/actions/git/deleteGitProvider.action';
import { saveGitLabProviderAction } from '@/actions/git/saveGitLabProvider.action';
import { saveGiteaProviderAction } from '@/actions/git/saveGiteaProvider.action';
import { saveBitbucketProviderAction } from '@/actions/git/saveBitbucketProvider.action';
import { saveAzureReposProviderAction } from '@/actions/git/saveAzureReposProvider.action';
import { saveTraefikFile } from '@/actions/traefik/saveTraefikFile.action';
import { deleteTraefikFile } from '@/actions/traefik/deleteTraefikFile.action';
import { moveTraefikEntry } from '@/actions/traefik/moveTraefikEntry.action';
import { connectCloudflareAction } from '@/actions/cloudflare/connect.action';
import { disconnectCloudflareAction } from '@/actions/cloudflare/disconnect.action';
import { addBucketStorageAccountAction } from '@/actions/bucket-storage/addAccount.action';
import { deleteBucketStorageAccountAction } from '@/actions/bucket-storage/deleteAccount.action';
import { createBackupScheduleAction } from '@/actions/bucket-storage/createSchedule.action';
import { deleteBackupScheduleAction } from '@/actions/bucket-storage/deleteSchedule.action';
import { uploadVolumeToBucketStorageAction } from '@/actions/bucket-storage/uploadVolumeToBucketStorage.action';
import { GET as listEnvironments } from '@/app/api/environments/route';
import { GET as getEnvironment } from '@/app/api/environments/[id]/route';
import { GET as listRegistries } from '@/app/api/registries/route';
import { GET as listCloudflareAccounts } from '@/app/api/cloudflare/accounts/route';
import { GET as getCloudflareZone } from '@/app/api/cloudflare/zone/route';
import { GET as listBucketStorageAccounts } from '@/app/api/bucket-storage/accounts/route';
import { GET as listBackupSchedules } from '@/app/api/backup/schedules/route';
import { GET as listSslCertificates } from '@/app/api/ssl-certificates/route';
import { GET as getTraefik, POST as postTraefik } from '@/app/api/traefik/route';
import { GET as getTraefikSlug, DELETE as deleteTraefikSlug } from '@/app/api/traefik/[...slug]/route';
import { GET as githubSetup } from '@/app/api/providers/github/setup/route';
import { GET as diskUsage } from '@/app/api/system/disk-usage/route';
import { GET as publicIp } from '@/app/api/network/public-ip/route';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { callRoute, type RouteHandler } from '../setup/invoke';
import { resetDatabase } from '../setup/db';
import { seedWorld } from '../setup/fixtures';
import { logout } from '../setup/session';
import { ADMIN_ONLY, allowOnly, DEVELOPER_AND_ABOVE, describePermissionMatrix, EVERY_ROLE } from './permissionMatrix';

const route = (handler: unknown, path: string, options: Record<string, unknown> = {}) =>
    callRoute(handler as RouteHandler, { url: `http://localhost:3022${path}`, ...options });

describePermissionMatrix('environment endpoints', [
    {
        name: 'createEnvironmentAction',
        kind: 'action',
        invoke: () => createEnvironmentAction({ name: 'staging-host', connectionType: 'UNIX_SOCKET' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateEnvironmentAction',
        kind: 'action',
        invoke: () =>
            updateEnvironmentAction({ id: 'environment-1', name: 'renamed', connectionType: 'UNIX_SOCKET' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateEnvironmentProtectionAction',
        kind: 'action',
        invoke: () =>
            updateEnvironmentProtectionAction({
                environmentId: 'environment-1',
                isProtected: true,
                allowAdminBypass: true,
                protectedActions: ['container.remove'],
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'setDefaultEnvironmentAction',
        kind: 'action',
        invoke: () => setDefaultEnvironmentAction({ id: 'environment-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteEnvironmentAction',
        kind: 'action',
        invoke: () => deleteEnvironmentAction({ id: 'environment-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/environments',
        kind: 'route',
        invoke: () => route(listEnvironments, '/api/environments'),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/environments/[id]',
        kind: 'route',
        invoke: () => route(getEnvironment, '/api/environments/environment-1', { params: { id: 'environment-1' } }),
        expected: EVERY_ROLE,
    },
]);

describePermissionMatrix('registry endpoints', [
    {
        name: 'createRegistryAction',
        kind: 'action',
        invoke: () =>
            createRegistryAction({
                name: 'ghcr',
                url: 'https://ghcr.io',
                username: 'nexploy',
                password: 'secret',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'updateRegistryAction',
        kind: 'action',
        invoke: () => updateRegistryAction({ id: 'registry-1', name: 'ghcr' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteRegistryAction',
        kind: 'action',
        invoke: () => deleteRegistryAction({ id: 'registry-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'mirrorImageAction',
        kind: 'action',
        invoke: () =>
            mirrorImageAction({
                sourceImage: 'alpine:latest',
                targetName: 'ghcr.io/nexploy/alpine:latest',
                registryId: 'registry-1',
            } as never),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/registries',
        kind: 'route',
        invoke: () => route(listRegistries, '/api/registries'),
        expected: DEVELOPER_AND_ABOVE,
    },
]);

describePermissionMatrix('git provider endpoints', [
    {
        name: 'saveGitLabProviderAction',
        kind: 'action',
        invoke: () =>
            saveGitLabProviderAction({
                clientId: 'client',
                clientSecret: 'secret',
                baseUrl: 'https://gitlab.com',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'saveGiteaProviderAction',
        kind: 'action',
        invoke: () =>
            saveGiteaProviderAction({
                clientId: 'client',
                clientSecret: 'secret',
                baseUrl: 'https://gitea.test',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'saveBitbucketProviderAction',
        kind: 'action',
        invoke: () => saveBitbucketProviderAction({ clientId: 'client', clientSecret: 'secret' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'saveAzureReposProviderAction',
        kind: 'action',
        invoke: () =>
            saveAzureReposProviderAction({
                clientId: 'client',
                clientSecret: 'secret',
                organization: 'nexploy',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteGitProviderAction',
        kind: 'action',
        invoke: () => deleteGitProviderAction({ provider: 'GITLAB' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/providers/github/setup',
        kind: 'route',
        invoke: () => route(githubSetup, '/api/providers/github/setup'),
        expected: ADMIN_ONLY,
    },
]);

describePermissionMatrix('traefik endpoints', [
    {
        name: 'saveTraefikFile',
        kind: 'action',
        invoke: () => saveTraefikFile({ path: 'dynamic/test.yml', content: 'http: {}' } as never),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'deleteTraefikFile',
        kind: 'action',
        invoke: () => deleteTraefikFile({ path: 'dynamic/test.yml' } as never),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'moveTraefikEntry',
        kind: 'action',
        invoke: () => moveTraefikEntry({ path: 'dynamic/test.yml', from: 'routers.a', to: 'routers.b' } as never),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/traefik',
        kind: 'route',
        invoke: () => route(getTraefik, '/api/traefik'),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'POST /api/traefik',
        kind: 'route',
        invoke: () => route(postTraefik, '/api/traefik', { method: 'POST', body: { path: 'dynamic/test.yml' } }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/traefik/[...slug]',
        kind: 'route',
        invoke: () => route(getTraefikSlug, '/api/traefik/dynamic', { params: { slug: ['dynamic'] } as never }),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'DELETE /api/traefik/[...slug]',
        kind: 'route',
        invoke: () =>
            route(deleteTraefikSlug, '/api/traefik/dynamic', {
                method: 'DELETE',
                params: { slug: ['dynamic'] } as never,
            }),
        expected: DEVELOPER_AND_ABOVE,
    },
]);

describePermissionMatrix('DNS endpoints', [
    {
        name: 'connectCloudflareAction',
        kind: 'action',
        invoke: () => connectCloudflareAction({ apiToken: 'token', accountName: 'nexploy' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'disconnectCloudflareAction',
        kind: 'action',
        invoke: () => disconnectCloudflareAction({ id: 'credential-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/cloudflare/accounts',
        kind: 'route',
        invoke: () => route(listCloudflareAccounts, '/api/cloudflare/accounts'),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/cloudflare/zone',
        kind: 'route',
        invoke: () => route(getCloudflareZone, '/api/cloudflare/zone?domain=example.test'),
        expected: DEVELOPER_AND_ABOVE,
    },
]);

describePermissionMatrix('cloud backup endpoints', [
    {
        name: 'addBucketStorageAccountAction',
        kind: 'action',
        invoke: () =>
            addBucketStorageAccountAction({
                name: 'backups',
                provider: 'S3',
                bucket: 'nexploy-backups',
                region: 'eu-west-3',
                accessKeyId: 'key',
                secretAccessKey: 'secret',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteBucketStorageAccountAction',
        kind: 'action',
        invoke: () => deleteBucketStorageAccountAction({ id: 'account-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'createBackupScheduleAction',
        kind: 'action',
        invoke: () =>
            createBackupScheduleAction({
                accountId: 'account-1',
                volumeName: 'data',
                cron: '0 3 * * *',
            } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'deleteBackupScheduleAction',
        kind: 'action',
        invoke: () => deleteBackupScheduleAction({ id: 'schedule-1' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'uploadVolumeToBucketStorageAction',
        kind: 'action',
        invoke: () => uploadVolumeToBucketStorageAction({ accountId: 'account-1', volumeName: 'data' } as never),
        expected: ADMIN_ONLY,
    },
    {
        name: 'GET /api/bucket-storage/accounts',
        kind: 'route',
        invoke: () => route(listBucketStorageAccounts, '/api/bucket-storage/accounts'),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/backup/schedules',
        kind: 'route',
        invoke: () => route(listBackupSchedules, '/api/backup/schedules?volume=data'),
        expected: ADMIN_ONLY,
    },
]);

describePermissionMatrix('host information endpoints', [
    {
        name: 'GET /api/ssl-certificates',
        kind: 'route',
        invoke: () => route(listSslCertificates, '/api/ssl-certificates'),
        expected: DEVELOPER_AND_ABOVE,
    },
    {
        name: 'GET /api/system/disk-usage',
        kind: 'route',
        invoke: () => route(diskUsage, '/api/system/disk-usage'),
        expected: EVERY_ROLE,
    },
    {
        name: 'GET /api/network/public-ip',
        kind: 'route',
        invoke: () => route(publicIp, '/api/network/public-ip'),
        expected: allowOnly('guest', 'developer', 'admin', 'system', 'orgOwner', 'orgAdmin', 'orgMember', 'outsider'),
    },
]);

describe('route middleware ordering', () => {
    beforeEach(async () => {
        await resetDatabase();
        await seedWorld();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('answers a validation error before the authentication middleware runs', async () => {
        logout();

        const response = await route(listBackupSchedules, '/api/backup/schedules');

        expect(response.status, 'query validation currently short-circuits the auth middleware').toBe(400);
    });

    it('answers 403 once the query is valid and the caller is anonymous', async () => {
        logout();

        const response = await route(listBackupSchedules, '/api/backup/schedules?volume=data');

        expect(response.status).toBe(403);
    });
});
