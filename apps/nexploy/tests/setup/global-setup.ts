import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { APP_ROOT, REPO_ROOT, TEST_DATABASE_URL } from './env';

const COMPOSE_FILE = resolve(REPO_ROOT, 'infra/docker/docker-compose.test.yml');
const AUTOSTART = process.env.NEXPLOY_TEST_DB_AUTOSTART !== '0';

function run(command: string, args: string[], cwd: string) {
    execFileSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
}

export default async function setup() {
    if (AUTOSTART) {
        run('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d', '--wait', 'postgres'], REPO_ROOT);
    }

    run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], APP_ROOT);
}
