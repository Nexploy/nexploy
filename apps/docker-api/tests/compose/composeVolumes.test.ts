import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isBindMount, parseComposeBindMounts, parseVolumeSpec } from '@/utils/compose/composeVolumeParser';
import { transformBindMountsForRemote } from '@/utils/compose/composeVolumeTransformer';
import type { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';

let projectDir: string;

beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexploy-volume-test-'));
});

afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
});

describe('isBindMount', () => {
    it('detects short and long syntax bind mounts', () => {
        expect(isBindMount('./data:/data')).toBe(true);
        expect(isBindMount('/var/run/docker.sock:/var/run/docker.sock')).toBe(true);
        expect(isBindMount({ type: 'bind', source: './data', target: '/data' })).toBe(true);
    });

    it('rejects named volumes in both syntaxes', () => {
        expect(isBindMount('pgdata:/var/lib/postgresql/data')).toBe(false);
        expect(isBindMount({ type: 'volume', source: 'pgdata', target: '/var/lib' })).toBe(false);
    });
});

describe('parseVolumeSpec', () => {
    it('reads the read-only flag from a combined option list', () => {
        expect(parseVolumeSpec('./data:/data:ro,z')).toEqual({
            hostPath: './data',
            containerPath: '/data',
            readOnly: true,
        });
    });

    it('returns null for named volumes', () => {
        expect(parseVolumeSpec('pgdata:/var/lib')).toBeNull();
    });
});

describe('parseComposeBindMounts', () => {
    it('ignores host paths outside the project directory', () => {
        const composeContent: ComposeContent = {
            services: {
                app: {
                    image: 'docker',
                    volumes: ['/var/run/docker.sock:/var/run/docker.sock', './data:/data'],
                },
            },
        };

        fs.mkdirSync(path.join(projectDir, 'data'));

        const mounts = parseComposeBindMounts(composeContent, projectDir);

        expect(mounts).toHaveLength(1);
        expect(mounts[0].hostPath).toBe('./data');
        expect(mounts[0].projectRelativePath).toBe('data');
    });
});

describe('transformBindMountsForRemote', () => {
    it('turns a project data mount into a named volume and leaves other volumes untouched', () => {
        fs.mkdirSync(path.join(projectDir, 'data'));

        const composeContent: ComposeContent = {
            services: {
                db: {
                    image: 'postgres:16',
                    volumes: [
                        './data:/var/lib/postgresql/data',
                        { type: 'volume', source: 'cache', target: '/cache' },
                        '/var/run/docker.sock:/var/run/docker.sock',
                    ],
                },
            },
        };

        const result = transformBindMountsForRemote(composeContent, projectDir, 'proj');
        const db = (result.modifiedComposeContent as ComposeContent).services?.db;

        expect(db?.volumes).toEqual([
            {
                type: 'volume',
                source: 'proj_db_var_lib_postgresql_data',
                target: '/var/lib/postgresql/data',
                read_only: false,
            },
            { type: 'volume', source: 'cache', target: '/cache' },
            '/var/run/docker.sock:/var/run/docker.sock',
        ]);
    });

    it('pins the generated volume name so compose does not prefix it again', () => {
        fs.mkdirSync(path.join(projectDir, 'data'));

        const composeContent: ComposeContent = {
            services: { db: { image: 'postgres:16', volumes: ['./data:/data'] } },
        };

        const result = transformBindMountsForRemote(composeContent, projectDir, 'proj');
        const volumes = (result.modifiedComposeContent as ComposeContent).volumes as Record<string, unknown>;

        expect(volumes.proj_db_data).toEqual({ name: 'proj_db_data' });
    });

    it('copies code mounts with a context-relative path', () => {
        fs.mkdirSync(path.join(projectDir, 'src'));
        fs.writeFileSync(path.join(projectDir, 'src', 'index.ts'), 'export {};\n', 'utf8');

        const composeContent: ComposeContent = {
            services: { app: { image: 'node:22', volumes: ['./src:/app/src'] } },
        };

        const result = transformBindMountsForRemote(composeContent, projectDir, 'proj');

        expect(result.generatedDockerfiles.get('app')).toBe('FROM node:22\nCOPY src /app/src');
    });
});
