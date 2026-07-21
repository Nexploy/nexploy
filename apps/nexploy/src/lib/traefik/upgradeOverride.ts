import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { TRAEFIK_SERVICE_DIR } from './paths';

const OVERRIDE_FILE = path.join(TRAEFIK_SERVICE_DIR, 'upgrade-override.yml');

function resolveDomain(): string | null {
    const publicUrl = process.env.NEXPLOY_URL ?? process.env.BETTER_AUTH_URL ?? '';
    const domain = publicUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return domain || null;
}

export async function enableUpgradeOverride(): Promise<void> {
    const domain = resolveDomain();
    if (!domain) return;

    const config = {
        http: {
            routers: {
                'nexploy-upgrade-override': {
                    entryPoints: ['websecure'],
                    rule: `Host(\`${domain}\`)`,
                    priority: 100,
                    middlewares: ['upgrading@file'],
                    service: 'noop@internal',
                    tls: {},
                },
            },
        },
    };

    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    await fs.writeFile(OVERRIDE_FILE, yaml.stringify(config), 'utf-8');
}

export async function disableUpgradeOverride(): Promise<void> {
    try {
        await fs.unlink(OVERRIDE_FILE);
    } catch {
        /* not present, nothing to do */
    }
}
