import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discoverComposeFiles, normalizeComposeProject } from '@/utils/compose/composeNormalizer';
import type { ComposeService } from '@workspace/typescript-interface/docker/docker.compose.build';

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
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexploy-compose-test-'));
});

afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
});

function writeCompose(name: string, content: string): string {
    const filePath = path.join(workDir, name);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
}

describe('discoverComposeFiles', () => {
    it('returns only the main file when no override exists', () => {
        const main = writeCompose('compose.yml', 'services:\n  app:\n    image: nginx\n');
        expect(discoverComposeFiles(main)).toEqual([main]);
    });

    it('picks up the sibling override file', () => {
        const main = writeCompose('docker-compose.yml', 'services:\n  app:\n    image: nginx\n');
        const override = writeCompose('docker-compose.override.yml', 'services:\n  app:\n    restart: always\n');
        expect(discoverComposeFiles(main)).toEqual([main, override]);
    });

    it('matches the override on either yaml extension', () => {
        const main = writeCompose('compose.yaml', 'services:\n  app:\n    image: nginx\n');
        const override = writeCompose('compose.override.yaml', 'services:\n  app:\n    restart: always\n');
        expect(discoverComposeFiles(main)).toEqual([main, override]);
    });
});

describeWithCompose('normalizeComposeProject', () => {
    const normalize = (files: string[], envVars: Record<string, string> = {}, profiles?: string[]) =>
        normalizeComposeProject({
            composeFiles: files,
            projectDirectory: workDir,
            projectName: 'nexploytest',
            envVars,
            dockerEnv: {},
            profiles,
        });

    it('resolves YAML merge anchors', async () => {
        const main = writeCompose(
            'compose.yml',
            [
                'x-base: &base',
                '  restart: unless-stopped',
                'services:',
                '  app:',
                '    <<: *base',
                '    image: nginx:alpine',
            ].join('\n'),
        );

        const { composeContent } = await normalize([main]);
        const app = composeContent.services?.app as ComposeService;

        expect(app.restart).toBe('unless-stopped');
        expect(Object.keys(app)).not.toContain('<<');
    });

    it('resolves extends', async () => {
        const main = writeCompose(
            'compose.yml',
            [
                'services:',
                '  base:',
                '    image: nginx:alpine',
                '    environment:',
                '      MODE: shared',
                '  worker:',
                '    extends:',
                '      service: base',
            ].join('\n'),
        );

        const { composeContent } = await normalize([main]);
        const worker = composeContent.services?.worker as ComposeService;

        expect(worker.image).toBe('nginx:alpine');
        expect(worker.environment).toEqual({ MODE: 'shared' });
    });

    it('interpolates variables and honours defaults', async () => {
        const main = writeCompose(
            'compose.yml',
            ['services:', '  app:', '    image: nginx:${TAG:-alpine}', '    hostname: ${HOST_NAME-fallback}'].join(
                '\n',
            ),
        );

        const { composeContent } = await normalize([main], { TAG: '1.27' });
        const app = composeContent.services?.app as ComposeService;

        expect(app.image).toBe('nginx:1.27');
        expect(app.hostname).toBe('fallback');
    });

    it('preserves $$ escapes so the deploy pass renders a literal dollar', async () => {
        const main = writeCompose(
            'compose.yml',
            ['services:', '  app:', '    image: busybox', '    command: sh -c "echo $$HOME"'].join('\n'),
        );

        const { yamlContent } = await normalize([main]);

        expect(yamlContent).toContain('$$HOME');
    });

    it('merges override files', async () => {
        const main = writeCompose('compose.yml', 'services:\n  app:\n    image: nginx:alpine\n');
        const override = writeCompose('compose.override.yml', 'services:\n  app:\n    restart: always\n');

        const { composeContent } = await normalize([main, override]);
        const app = composeContent.services?.app as ComposeService;

        expect(app.restart).toBe('always');
    });

    it('excludes profile-gated services unless the profile is enabled', async () => {
        const main = writeCompose(
            'compose.yml',
            [
                'services:',
                '  app:',
                '    image: nginx:alpine',
                '  debug:',
                '    image: busybox',
                '    profiles: [debug]',
            ].join('\n'),
        );

        const withoutProfile = await normalize([main]);
        expect(Object.keys(withoutProfile.composeContent.services || {})).toEqual(['app']);

        const withProfile = await normalize([main], {}, ['debug']);
        expect(Object.keys(withProfile.composeContent.services || {}).sort()).toEqual(['app', 'debug']);
    });

    it('keeps bind mount and build paths relative to the compose file', async () => {
        fs.mkdirSync(path.join(workDir, 'api'));
        fs.writeFileSync(path.join(workDir, 'api', 'Dockerfile'), 'FROM busybox\n', 'utf8');

        const main = writeCompose(
            'compose.yml',
            ['services:', '  api:', '    build: ./api', '    volumes:', '      - ./data:/data'].join('\n'),
        );

        const { composeContent } = await normalize([main]);
        const api = composeContent.services?.api as ComposeService;

        expect(api.build).toMatchObject({ context: './api' });
        expect(api.volumes?.[0]).toMatchObject({ type: 'bind', source: './data', target: '/data' });
    });

    it('reports a compose validation error instead of silently succeeding', async () => {
        const main = writeCompose('compose.yml', 'services:\n  app:\n    unknown_key_here: true\n');

        await expect(normalize([main])).rejects.toThrow(/Invalid Docker Compose project/);
    });

    it('fails when a required variable is missing', async () => {
        const main = writeCompose(
            'compose.yml',
            'services:\n  app:\n    image: ${REQUIRED_IMAGE:?image is required}\n',
        );

        await expect(normalize([main])).rejects.toThrow(/Invalid Docker Compose project/);
    });
});
