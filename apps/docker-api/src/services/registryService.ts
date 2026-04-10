import { logger } from '@/utils/logger';
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
