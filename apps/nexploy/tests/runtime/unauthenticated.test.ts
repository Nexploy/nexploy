import crypto from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GET as dockerApiKey } from '@/app/api/internal/docker-api-key/route';
import { GET as repositoryOrganizations } from '@/app/api/internal/repository-organizations/route';
import { POST as verifyApiKey } from '@/app/api/internal/verify-api-key/route';
import { POST as syncDeleteVolumes } from '@/app/api/internal/volumes/sync-delete/route';
import { POST as syncDeleteVersions } from '@/app/api/internal/versions/sync-delete/route';
import { POST as githubWebhook } from '@/app/api/webhooks/github/route';
import { POST as gitlabWebhook } from '@/app/api/webhooks/gitlab/route';
import { POST as giteaWebhook } from '@/app/api/webhooks/gitea/route';
import { POST as bitbucketWebhook } from '@/app/api/webhooks/bitbucket/route';
import { POST as azureReposWebhook } from '@/app/api/webhooks/azure-repos/route';
import { POST as chat } from '@/app/api/chat/route';
import { callRoute, type RouteHandler } from '../setup/invoke';
import { resetDatabase } from '../setup/db';
import { prisma } from '../../prisma/prisma';
import { seedWorld, type WorldFixture } from '../setup/fixtures';
import { logout } from '../setup/session';

const INTERNAL_SECRET = process.env.ENCRYPTION_KEY as string;

const WEBHOOK_SECRET = 'webhook-secret';

const PUSH_PAYLOAD = {
    ref: 'refs/heads/main',
    repository: { html_url: 'https://github.com/nexploy/repo-a', full_name: 'nexploy/repo-a' },
    after: '0123456789abcdef0123456789abcdef01234567',
    head_commit: { id: '0123456789abcdef0123456789abcdef01234567', message: 'test' },
};

function githubSignature(rawBody: string, secret: string) {
    return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

async function callWebhook(handler: unknown, headers: Record<string, string>, payload: unknown = PUSH_PAYLOAD) {
    const rawBody = JSON.stringify(payload);

    return (handler as (request: Request) => Promise<Response>)(
        new Request('http://localhost:3022/api/webhooks/github', {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: rawBody,
        }),
    );
}

describe('internal service endpoints', () => {
    beforeEach(async () => {
        await resetDatabase();
        await seedWorld();
        logout();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('refuses the docker-api key endpoint without the internal secret', async () => {
        const response = await callRoute(dockerApiKey as RouteHandler, {
            url: 'http://localhost:3022/api/internal/docker-api-key',
        });

        expect(response.status).toBe(401);
    });

    it('refuses the docker-api key endpoint with a wrong internal secret', async () => {
        const response = await callRoute(dockerApiKey as RouteHandler, {
            url: 'http://localhost:3022/api/internal/docker-api-key',
            headers: { 'x-internal-secret': 'not-the-secret' },
        });

        expect(response.status).toBe(401);
    });

    it('accepts the docker-api key endpoint with the internal secret', async () => {
        const response = await callRoute(dockerApiKey as RouteHandler, {
            url: 'http://localhost:3022/api/internal/docker-api-key',
            headers: { 'x-internal-secret': INTERNAL_SECRET },
        });

        expect(response.status).not.toBe(401);
    });

    it('refuses the repository ownership endpoint without the internal secret', async () => {
        const response = await callRoute(repositoryOrganizations as RouteHandler, {
            url: 'http://localhost:3022/api/internal/repository-organizations',
        });

        expect(response.status).toBe(401);
    });

    it('accepts the repository ownership endpoint with the internal secret', async () => {
        const response = await callRoute(repositoryOrganizations as RouteHandler, {
            url: 'http://localhost:3022/api/internal/repository-organizations',
            headers: { 'x-internal-secret': INTERNAL_SECRET },
        });

        expect(response.status).not.toBe(401);
    });

    it('refuses the API key verification endpoint without the internal secret', async () => {
        const response = await callRoute(verifyApiKey as RouteHandler, {
            url: 'http://localhost:3022/api/internal/verify-api-key',
            method: 'POST',
            body: { key: 'whatever' },
        });

        expect(response.status).toBe(401);
    });

    it('refuses the volume sync endpoint without an API key', async () => {
        const response = await callRoute(syncDeleteVolumes as RouteHandler, {
            url: 'http://localhost:3022/api/internal/volumes/sync-delete',
            method: 'POST',
            body: { volumeName: 'data' },
        });

        expect(response.status).toBe(401);
    });

    it('refuses the volume sync endpoint with an invalid API key', async () => {
        const response = await callRoute(syncDeleteVolumes as RouteHandler, {
            url: 'http://localhost:3022/api/internal/volumes/sync-delete',
            method: 'POST',
            headers: { 'x-api-key': 'invalid-key' },
            body: { volumeName: 'data' },
        });

        expect(response.status).toBe(401);
    });

    it('refuses the version sync endpoint without an API key', async () => {
        const response = await callRoute(syncDeleteVersions as RouteHandler, {
            url: 'http://localhost:3022/api/internal/versions/sync-delete',
            method: 'POST',
            body: { repositoryId: 'repo', imageTag: 'tag' },
        });

        expect(response.status).toBe(401);
    });
});

describe('git webhook authentication', () => {
    let world: WorldFixture;

    beforeEach(async () => {
        await resetDatabase();
        world = await seedWorld();
        logout();

        await prisma.repository.update({
            where: { id: world.repositories.inOrgA },
            data: { webhookSecret: WEBHOOK_SECRET },
        });
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('refuses a GitHub webhook with no signature', async () => {
        const response = await callWebhook(githubWebhook, { 'x-github-event': 'push' });

        expect(response.status).toBe(401);
    });

    it('refuses a GitHub webhook signed with the wrong secret', async () => {
        const rawBody = JSON.stringify(PUSH_PAYLOAD);

        const response = await callWebhook(githubWebhook, {
            'x-github-event': 'push',
            'x-hub-signature-256': githubSignature(rawBody, 'wrong-secret'),
        });

        expect(response.status).toBe(401);
    });

    it('accepts a GitHub webhook signed with the repository secret', async () => {
        const rawBody = JSON.stringify(PUSH_PAYLOAD);

        const response = await callWebhook(githubWebhook, {
            'x-github-event': 'push',
            'x-hub-signature-256': githubSignature(rawBody, WEBHOOK_SECRET),
        });

        expect(response.status).not.toBe(401);
    });

    it('ignores a payload that carries no repository, before any signature check', async () => {
        const response = await callWebhook(githubWebhook, { 'x-github-event': 'ping' }, { zen: 'Design for failure.' });
        const builds = await prisma.build.count({ where: { repositoryId: world.repositories.inOrgA } });

        expect(response.status).toBe(200);
        expect(builds).toBe(1);
    });

    it('starts no build when an unsigned push arrives', async () => {
        const response = await callWebhook(githubWebhook, { 'x-github-event': 'push' });
        const builds = await prisma.build.count({ where: { repositoryId: world.repositories.inOrgA } });

        expect(response.status).toBe(401);
        expect(builds).toBe(1);
    });

    it('answers 404 for a repository the webhook does not match', async () => {
        const rawBody = JSON.stringify({
            ...PUSH_PAYLOAD,
            repository: { html_url: 'https://github.com/nexploy/unknown', full_name: 'nexploy/unknown' },
        });

        const response = await callWebhook(
            githubWebhook,
            {
                'x-github-event': 'push',
                'x-hub-signature-256': githubSignature(rawBody, WEBHOOK_SECRET),
            },
            JSON.parse(rawBody),
        );

        expect(response.status).toBe(404);
    });

    it('refuses a Gitea webhook with no signature', async () => {
        const response = await callWebhook(giteaWebhook, { 'x-gitea-event': 'push' });

        expect(response.status).toBe(401);
    });

    it('refuses a Bitbucket webhook with no token', async () => {
        await prisma.repository.update({
            where: { id: world.repositories.inOrgA },
            data: { repositoryUrl: 'https://bitbucket.org/nexploy/repo-a.git' },
        });

        const response = await callWebhook(
            bitbucketWebhook,
            { 'x-event-key': 'repo:push' },
            {
                repository: {
                    links: { html: { href: 'https://github.com/nexploy/repo-a' } },
                    full_name: 'nexploy/repo-a',
                },
                push: { changes: [{ new: { name: 'main', type: 'branch', target: { hash: '0123456789ab' } } }] },
            },
        );

        expect(response.status).toBe(401);
    });

    it('refuses an Azure Repos webhook with no token', async () => {
        const response = await callWebhook(
            azureReposWebhook,
            {},
            {
                eventType: 'git.push',
                resource: {
                    repository: { remoteUrl: 'https://github.com/nexploy/repo-a' },
                    refUpdates: [{ name: 'refs/heads/main', newObjectId: '0123456789ab' }],
                },
            },
        );

        expect(response.status).toBe(401);
    });

    it('refuses a GitLab webhook with no token', async () => {
        const response = await callWebhook(
            gitlabWebhook,
            { 'x-gitlab-event': 'Push Hook' },
            {
                object_kind: 'push',
                ref: 'refs/heads/main',
                project: {
                    git_http_url: 'https://github.com/nexploy/repo-a',
                    web_url: 'https://github.com/nexploy/repo-a',
                },
                checkout_sha: '0123456789abcdef0123456789abcdef01234567',
            },
        );

        expect(response.status).toBe(401);
    });
});

describe('AI chat endpoint', () => {
    beforeEach(async () => {
        await resetDatabase();
        await seedWorld();
        logout();
    });

    afterAll(async () => {
        await resetDatabase();
    });

    it('refuses an anonymous caller', async () => {
        const response = await callRoute(chat as RouteHandler, {
            url: 'http://localhost:3022/api/chat',
            method: 'POST',
            body: { messages: [], provider: 'OPENAI', model: 'gpt-4o' },
        });

        expect(response.status).toBe(403);
    });
});
