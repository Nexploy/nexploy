import { Hono } from 'hono';
import { handleAsync } from '@/helpers/handleAsync';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = new Hono();

function writeDockerConfig(serveraddress: string, username: string, password: string): void {
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

app.post(
    '/login',
    handleAsync(async (c) => {
        const { serveraddress, username, password } = await c.req.json<{
            serveraddress: string;
            username: string;
            password: string;
        }>();

        // Validate credentials directly against the registry API (HTTP first, then HTTPS)
        const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        let validated = false;

        for (const scheme of ['http', 'https']) {
            try {
                const res = await fetch(`${scheme}://${serveraddress}/v2/`, {
                    headers: { Authorization: authHeader },
                    signal: AbortSignal.timeout(5000),
                });

                // 200 = ok, 401 = wrong credentials, anything else = try other scheme
                if (res.status === 200 || res.status === 401) {
                    if (res.status === 401) {
                        throw new Error(`Authentication failed for registry ${serveraddress}`);
                    }
                    validated = true;
                    break;
                }
            } catch (e) {
                if (e instanceof Error && e.message.includes('Authentication failed')) throw e;
                // Network error or wrong scheme → try next
            }
        }

        if (!validated) {
            throw new Error(`Cannot reach registry ${serveraddress}`);
        }

        writeDockerConfig(serveraddress, username, password);
        logger.info({ serveraddress }, 'docker login succeeded');

        return { success: true };
    }),
);

app.post(
    '/logout',
    handleAsync(async (c) => {
        const { serveraddress } = await c.req.json<{ serveraddress: string }>();

        const configPath = path.join(os.homedir(), '.docker', 'config.json');

        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.auths?.[serveraddress]) {
                delete config.auths[serveraddress];
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
                logger.info({ serveraddress }, 'Docker credentials removed from config.json');
            }
        } catch {}

        return { success: true };
    }),
);

export default app;
