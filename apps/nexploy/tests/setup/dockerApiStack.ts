import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { REPO_ROOT } from './env';

const DOCKER_API_DIR = join(REPO_ROOT, 'apps/docker-api');

const DOCKER_API_PORT = process.env.TEST_DOCKER_API_PORT ?? '3322';
const STUB_PORT = process.env.TEST_NEXPLOY_STUB_PORT ?? '3323';
const DOCKER_HOST = process.env.TEST_DOCKER_HOST ?? '127.0.0.1';
const DOCKER_PORT = Number(process.env.TEST_DOCKER_PORT ?? 12375);
const API_KEY = process.env.NEXPLOY_API_KEY ?? 'test-docker-api-key';
const INTERNAL_SECRET = process.env.ENCRYPTION_KEY ?? '';

const DIND_ENVIRONMENT = {
    id: 'test-dind',
    name: 'Docker-in-Docker (tests)',
    connectionType: 'TCP',
    host: DOCKER_HOST,
    port: DOCKER_PORT,
    isDefault: true,
    isActive: true,
};

async function readBody(request: import('node:http').IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk as Buffer);

    try {
        return JSON.parse(Buffer.concat(chunks).toString() || '{}');
    } catch {
        return {};
    }
}

function startNexployStub(): Promise<Server> {
    const server = createServer(async (request, response) => {
        const url = new URL(request.url ?? '/', `http://127.0.0.1:${STUB_PORT}`);

        const json = (body: unknown, status = 200) => {
            response.writeHead(status, { 'content-type': 'application/json' });
            response.end(JSON.stringify(body));
        };

        if (url.pathname === '/api/environments') return json([DIND_ENVIRONMENT]);
        if (url.pathname.startsWith('/api/environments/')) return json(DIND_ENVIRONMENT);

        if (url.pathname === '/api/internal/verify-api-key') {
            const body = await readBody(request);
            const secretMatches = request.headers['x-internal-secret'] === INTERNAL_SECRET;
            return json({ valid: secretMatches && body.key === API_KEY }, secretMatches ? 200 : 401);
        }

        if (url.pathname.endsWith('/sync-delete')) return json({ deleted: 0 });

        json({ error: 'Not found in the nexploy stub' }, 404);
    });

    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(Number(STUB_PORT), '127.0.0.1', () => resolve(server));
    });
}

async function waitForDockerApi(): Promise<void> {
    const deadline = Date.now() + 90_000;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(`http://127.0.0.1:${DOCKER_API_PORT}/api/system/df`, {
                headers: { Authorization: `Bearer ${API_KEY}` },
            });

            if (response.status < 500) return;
        } catch {
            /* not up yet */
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`docker-api did not become ready on port ${DOCKER_API_PORT}`);
}

export interface DockerApiStack {
    stop: () => Promise<void>;
}

export async function startDockerApiStack(): Promise<DockerApiStack> {
    const stub = await startNexployStub();

    const dockerApi: ChildProcess = spawn('pnpm', ['exec', 'tsx', 'src/index.ts'], {
        cwd: DOCKER_API_DIR,
        stdio: process.env.NEXPLOY_TEST_DOCKER_LOGS === '1' ? 'inherit' : 'ignore',
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: DOCKER_API_PORT,
            LOG_LEVEL: 'error',
            NEXPLOY_API_URL: `http://127.0.0.1:${STUB_PORT}`,
            NEXPLOY_API_KEY: API_KEY,
            ENCRYPTION_KEY: INTERNAL_SECRET,
        },
    });

    const stop = async () => {
        dockerApi.kill('SIGTERM');
        await new Promise<void>((resolve) => stub.close(() => resolve()));
    };

    try {
        await waitForDockerApi();
    } catch (error) {
        await stop();
        throw error;
    }

    return { stop };
}
