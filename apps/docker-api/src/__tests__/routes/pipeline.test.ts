import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import { getComposeContainerIds, runDockerCompose } from '@/utils/dockerComposeRunner';
import pipelineRoutes from '@/routes/pipelineRoutes';

const app = new Hono();
app.route('/api/pipeline', pipelineRoutes);

vi.mock('@/managers/containersStateManager', () => ({
    containersStateManager: {
        deploy: vi.fn(),
    },
}));

vi.mock('@/lib/dockerContext', () => ({
    getCurrentDockerClient: vi.fn(),
    getCurrentEnvironmentId: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/dockerClientRegistry', () => ({
    dockerClientRegistry: {
        getEnvironmentConfig: vi.fn().mockReturnValue(null),
    },
}));

vi.mock('@/utils/dockerComposeRunner', () => ({
    buildDockerHostEnv: vi.fn().mockReturnValue({ env: {}, cleanup: vi.fn() }),
    getComposeContainerIds: vi.fn().mockResolvedValue(['c1', 'c2']),
    runDockerCompose: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/utils/composePreprocessor', () => ({
    substituteEnvVars: vi.fn((yaml: string) => yaml),
}));

vi.mock('@/lib/config', () => ({
    TRAEFIK_NETWORK_NAME: 'traefik',
}));

vi.mock('@/middleware/locale.middleware', () => ({
    getTranslations: vi.fn(() => (key: string) => key),
    localeMiddleware: (_c: any, next: any) => next(),
}));

vi.mock('@/utils/logger', () => ({
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>();
    return {
        ...actual,
        mkdtempSync: vi.fn().mockReturnValue('/tmp/nexploy-compose-test'),
        writeFileSync: vi.fn(),
        rmSync: vi.fn(),
    };
});

describe('POST /api/pipeline/deploy', () => {
    beforeEach(() => vi.clearAllMocks());

    it('deploys a container and returns its id', async () => {
        vi.mocked(containersStateManager.deploy).mockResolvedValue({
            id: 'new-container-id',
        } as any);

        const res = await app.request('/api/pipeline/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repositoryId: 'repo1',
                imageName: 'nginx:latest',
                options: { port: 80 },
            }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json).toEqual({ id: 'new-container-id' });
        expect(containersStateManager.deploy).toHaveBeenCalledWith('repo1', 'nginx:latest', {
            port: 80,
        });
    });

    it('returns 500 if deploy throws', async () => {
        vi.mocked(containersStateManager.deploy).mockRejectedValueOnce(
            new Error('Image not found'),
        );

        const res = await app.request('/api/pipeline/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repositoryId: 'repo1', imageName: 'bad:image' }),
        });

        expect(res.status).toBe(500);
    });
});

describe('POST /api/pipeline/deploy-compose', () => {
    const mockDockerClient = {
        listContainers: vi.fn().mockResolvedValue([]),
        getContainer: vi.fn(),
        getNetwork: vi.fn().mockReturnValue({
            connect: vi.fn().mockResolvedValue(undefined),
            inspect: vi.fn().mockResolvedValue({ Containers: {} }),
        }),
    };

    // Minimal valid docker-compose.yml encoded in base64
    const composeYaml = `
services:
  web:
    image: nginx:latest
`;
    const composeBase64 = Buffer.from(composeYaml).toString('base64');

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCurrentDockerClient).mockReturnValue(mockDockerClient as any);
        vi.mocked(runDockerCompose).mockResolvedValue(0);
        vi.mocked(getComposeContainerIds).mockResolvedValue(['c1']);
    });

    it('deploys a compose stack and returns container ids', async () => {
        const res = await app.request('/api/pipeline/deploy-compose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repositoryId: 'repo1',
                projectName: 'myproject',
                composeConfig: composeBase64,
                envVars: {},
            }),
        });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.containers).toEqual(['c1']);
    });

    it('returns 500 if docker compose up fails (exit code != 0)', async () => {
        vi.mocked(runDockerCompose).mockImplementation(async (args: string[]) => {
            if (args.includes('up')) return 1;
            return 0;
        });

        const res = await app.request('/api/pipeline/deploy-compose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repositoryId: 'repo1',
                projectName: 'myproject',
                composeConfig: composeBase64,
            }),
        });

        expect(res.status).toBe(500);
    });
});
