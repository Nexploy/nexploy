import { logger } from '@/utils/logger';
import ky from 'ky';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function writeDockerConfig(serveraddress: string, username: string, password: string): void {
    const dockerConfigDir = path.join(os.homedir(), '.docker');
    const configPath = path.join(dockerConfigDir, 'config.json');

    if (!fs.existsSync(dockerConfigDir)) {
        fs.mkdirSync(dockerConfigDir, { recursive: true });
    }

    let config: Record<string, any> = {};
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {}

    config.auths = config.auths || {};
    config.auths[serveraddress] = {
        auth: Buffer.from(`${username}:${password}`).toString('base64'),
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    logger.info({ serveraddress }, 'Docker credentials saved to config.json');
}

export function removeDockerConfig(serveraddress: string): void {
    const configPath = path.join(os.homedir(), '.docker', 'config.json');

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.auths?.[serveraddress]) {
            delete config.auths[serveraddress];
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            logger.info({ serveraddress }, 'Docker credentials removed from config.json');
        }
    } catch {}
}

export async function pingRegistry(serveraddress: string): Promise<void> {
    let lastError = 'no response';

    for (const scheme of ['https', 'http'] as const) {
        try {
            const res = await ky.get(`${scheme}://${serveraddress}/v2/`, {
                redirect: 'follow',
                timeout: 10000,
                throwHttpErrors: false,
            });

            if (res.status === 200 || res.status === 401 || res.status === 403) {
                return;
            }

            lastError = `unexpected status ${res.status}`;
        } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
        }
    }

    logger.warn({ serveraddress, lastError }, 'registry ping failed');
    throw new Error(`Registry ${serveraddress} is not reachable: ${lastError}`);
}

export function validateRegistry(
    serveraddress: string,
    username: string,
    password: string,
): boolean {
    const result = spawnSync(
        'docker',
        ['login', serveraddress, '--username', username, '--password-stdin'],
        { input: password, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    if (result.status === 0) return true;

    const stderr = result.stderr?.toString() ?? '';
    logger.warn({ serveraddress, stderr }, 'docker login failed');
    return false;
}
