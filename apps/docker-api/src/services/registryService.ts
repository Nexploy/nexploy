import { logger } from '@/utils/logger';
import { kyRegistry } from '@/lib/kyRegistry';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function writeDockerConfig(
    serveraddress: string,
    username: string,
    password: string,
): void {
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

export async function validateRegistry(
    serveraddress: string,
    username: string,
    password: string,
): Promise<boolean> {
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    for (const scheme of ['http', 'https']) {
        const res = await kyRegistry.get(`${scheme}://${serveraddress}/v2/`, {
            headers: { Authorization: authHeader },
            throwHttpErrors: false,
        });

        if (res.status === 200) return true;
    }

    return false;
}
