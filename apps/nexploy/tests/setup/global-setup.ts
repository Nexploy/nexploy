import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { APP_ROOT, REPO_ROOT, TEST_DATABASE_URL } from './env';
import { startDockerApiStack, type DockerApiStack } from './dockerApiStack';

const COMPOSE_FILE = resolve(REPO_ROOT, 'infra/docker/docker-compose.test.yml');
const AUTOSTART = process.env.NEXPLOY_TEST_DB_AUTOSTART !== '0';
const KEEP_STACK = process.env.NEXPLOY_TEST_STACK_KEEP === '1';

export const USES_REAL_DOCKER_API = process.env.NEXPLOY_TEST_DOCKER === 'real';
export const USES_REAL_INNGEST = process.env.NEXPLOY_TEST_INNGEST === 'real' || USES_REAL_DOCKER_API;

function run(command: string, args: string[], cwd: string) {
    execFileSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
}

function compose(...args: string[]) {
    run('docker', ['compose', '-f', COMPOSE_FILE, ...args], REPO_ROOT);
}

async function waitForInngest() {
    const baseUrl = process.env.INNGEST_BASE_URL ?? 'http://127.0.0.1:8299';
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(baseUrl);
            if (response.status < 500) return;
        } catch {
            /* not up yet */
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`The test Inngest server did not become ready on ${baseUrl}`);
}

function seedDind() {
    const daemon = `tcp://${process.env.TEST_DOCKER_HOST ?? '127.0.0.1'}:${process.env.TEST_DOCKER_PORT ?? 12375}`;

    try {
        execFileSync('docker', ['-H', daemon, 'pull', 'alpine:latest'], { stdio: 'ignore' });
    } catch {
        /* the tests that need an image pull will report it themselves */
    }
}

export default async function setup() {
    let dockerApi: DockerApiStack | undefined;

    const services = ['postgres'];
    if (USES_REAL_DOCKER_API) services.push('dind');
    if (USES_REAL_INNGEST) services.push('inngest');

    if (AUTOSTART) {
        compose('up', '-d', '--wait', ...services);
    }

    run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], APP_ROOT);

    if (USES_REAL_INNGEST) {
        await waitForInngest();
    }

    if (USES_REAL_DOCKER_API) {
        seedDind();
        dockerApi = await startDockerApiStack();
    }

    return async () => {
        await dockerApi?.stop();

        if (AUTOSTART && !KEEP_STACK) {
            compose('down', '-v', '--remove-orphans');
        }
    };
}
