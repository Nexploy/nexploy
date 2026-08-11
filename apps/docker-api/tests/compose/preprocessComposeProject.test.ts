import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import yaml from 'yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PROCESSED_COMPOSE_FILENAME, preprocessComposeProject } from '@/utils/compose/composePhases';
import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';

function hasDockerCompose(): boolean {
    try {
        execFileSync('docker', ['compose', 'version'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

const describeWithCompose = hasDockerCompose() ? describe : describe.skip;

let workDir: string;

beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexploy-preprocess-test-'));
});

afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
});

describeWithCompose('preprocessComposeProject', () => {
    const preprocess = (composePath: string, envVars: Record<string, string> = {}) =>
        preprocessComposeProject({
            workDir,
            projectName: 'nexploytest',
            composePath,
            envVars,
            dockerEnv: {},
            labels: { 'nexploy.repository': 'repo-1' },
            isRemoteEnvironment: false,
            sendLog: () => {},
        });

    it('produces a processed file docker compose can read back unchanged', async () => {
        fs.writeFileSync(
            path.join(workDir, 'compose.yml'),
            [
                'x-base: &base',
                '  restart: unless-stopped',
                'services:',
                '  app:',
                '    <<: *base',
                '    image: nginx:${TAG:-alpine}',
                '    labels:',
                '      - "team=core"',
                '    command: sh -c "echo $$HOME"',
            ].join('\n'),
            'utf8',
        );

        const result = await preprocess('compose.yml', { TAG: '1.27' });
        const processed = yaml.parse(fs.readFileSync(result.processedComposeFile, 'utf8')) as ComposeContent;
        const app = processed.services?.app;

        expect(path.basename(result.processedComposeFile)).toBe(PROCESSED_COMPOSE_FILENAME);
        expect(app?.image).toBe('nginx:1.27');
        expect(app?.restart).toBe('unless-stopped');
        expect(app?.container_name).toBeUndefined();
        expect(app?.labels).toEqual({ team: 'core', 'nexploy.repository': 'repo-1' });
        expect(result.servicesToPull).toEqual(['app']);

        const rendered = execFileSync(
            'docker',
            ['compose', '-p', 'nexploytest', '-f', result.processedComposeFile, 'config'],
            { encoding: 'utf8' },
        );

        expect(rendered).toContain('$$HOME');
    });

    it('keeps replicas deployable by not forcing a container name', async () => {
        fs.writeFileSync(
            path.join(workDir, 'compose.yml'),
            ['services:', '  app:', '    image: nginx:alpine', '    deploy:', '      replicas: 3'].join('\n'),
            'utf8',
        );

        const result = await preprocess('compose.yml');

        expect(result.composeContent.services?.app.container_name).toBeUndefined();

        const exitCode = execFileSync(
            'docker',
            ['compose', '-p', 'nexploytest', '-f', result.processedComposeFile, 'config', '--quiet'],
            { encoding: 'utf8' },
        );

        expect(exitCode).toBe('');
    });

    it('resolves a compose file living in a subdirectory', async () => {
        fs.mkdirSync(path.join(workDir, 'deploy'));
        fs.writeFileSync(
            path.join(workDir, 'deploy', 'compose.yml'),
            'services:\n  app:\n    image: nginx:alpine\n',
            'utf8',
        );

        const result = await preprocess('deploy/compose.yml');

        expect(result.composeDir).toBe(path.join(workDir, 'deploy'));
        expect(fs.existsSync(result.processedComposeFile)).toBe(true);
    });

    it('surfaces a compose error instead of a generic failure', async () => {
        fs.writeFileSync(path.join(workDir, 'compose.yml'), 'services:\n  app:\n    image: [invalid\n', 'utf8');

        await expect(preprocess('compose.yml')).rejects.toThrow(/Invalid Docker Compose project/);
    });
});
