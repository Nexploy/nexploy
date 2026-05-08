import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { EnvironmentConfig } from '@workspace/typescript-interface/docker/environment/environment';

export interface DockerEnvResult {
    env: Record<string, string>;
    cleanup?: () => void;
}

export function buildDockerHostEnv(envConfig: EnvironmentConfig | null): DockerEnvResult {
    if (!envConfig) {
        return { env: {} };
    }

    switch (envConfig.connectionType) {
        case 'UNIX_SOCKET': {
            const socketPath = envConfig.socketPath || '/var/run/docker.sock';
            if (socketPath === '/var/run/docker.sock') {
                return { env: {} };
            }
            return { env: { DOCKER_HOST: `unix://${socketPath}` } };
        }
        case 'TCP':
            return { env: { DOCKER_HOST: `tcp://${envConfig.host}:${envConfig.port}` } };
        case 'TCP_TLS': {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexploy-tls-'));
            fs.writeFileSync(path.join(tmpDir, 'ca.pem'), envConfig.tlsCa || '');
            fs.writeFileSync(path.join(tmpDir, 'cert.pem'), envConfig.tlsCert || '');
            fs.writeFileSync(path.join(tmpDir, 'key.pem'), envConfig.tlsKey || '');
            return {
                env: {
                    DOCKER_HOST: `tcp://${envConfig.host}:${envConfig.port}`,
                    DOCKER_TLS_VERIFY: '1',
                    DOCKER_CERT_PATH: tmpDir,
                },
                cleanup: () => {
                    try {
                        fs.rmSync(tmpDir, { recursive: true, force: true });
                    } catch {}
                },
            };
        }
        default:
            return { env: {} };
    }
}

export function runDockerCompose(
    args: string[],
    cwd: string,
    dockerEnv: Record<string, string>,
    onLog: (msg: string) => void,
    signal?: AbortSignal,
): Promise<number> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new Error('Aborted'));
            return;
        }

        const env = { ...process.env, ...dockerEnv };
        const proc = spawn('docker', ['compose', ...args], { cwd, env });

        const onAbort = () => {
            proc.kill('SIGTERM');
            reject(new Error('Aborted'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });

        proc.stdout.on('data', (data: Buffer) => {
            for (const line of data.toString().split('\n')) {
                if (line.trim()) onLog(line.trimEnd());
            }
        });

        proc.stderr.on('data', (data: Buffer) => {
            for (const line of data.toString().split('\n')) {
                if (line.trim()) onLog(line.trimEnd());
            }
        });

        proc.on('close', (code) => {
            signal?.removeEventListener('abort', onAbort);
            resolve(code ?? 1);
        });

        proc.on('error', (err) => {
            signal?.removeEventListener('abort', onAbort);
            reject(err);
        });
    });
}

export async function getComposeContainerIds(
    projectName: string,
    composeFile: string,
    cwd: string,
    dockerEnv: Record<string, string>,
): Promise<string[]> {
    return new Promise((resolve) => {
        const env = { ...process.env, ...dockerEnv };
        const proc = spawn(
            'docker',
            ['compose', '-p', projectName, '-f', composeFile, 'ps', '-q'],
            { cwd, env },
        );
        let output = '';
        proc.stdout.on('data', (data: Buffer) => {
            output += data.toString();
        });
        proc.on('close', () => {
            resolve(
                output
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean),
            );
        });
        proc.on('error', () => resolve([]));
    });
}
