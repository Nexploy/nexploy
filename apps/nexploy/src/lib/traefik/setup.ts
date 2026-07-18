import * as fs from 'fs/promises';
import * as path from 'path';
import { TRAEFIK_SERVICE_DIR } from './paths';

const TEMPLATES_DIR = process.env.TRAEFIK_TEMPLATES_DIR ?? path.join(process.cwd(), 'traefik-templates');

const SEED_FILES = ['middlewares.yml', 'routers.yml', 'maintenance.yml'];

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function seedDynamicConfigFiles(): Promise<void> {
    for (const file of SEED_FILES) {
        const target = path.join(TRAEFIK_SERVICE_DIR, file);
        if (await fileExists(target)) continue;

        const source = path.join(TEMPLATES_DIR, file);
        if (!(await fileExists(source))) {
            console.warn(`⚠️ Traefik setup: template ${file} not found at ${source}, skipping seed`);
            continue;
        }

        await fs.copyFile(source, target);
        console.log(`✓ Traefik setup: seeded ${file}`);
    }
}

async function renderStaticConfig(): Promise<void> {
    const target = process.env.TRAEFIK_STATIC_CONFIG_PATH;
    if (!target) return;
    if (await fileExists(target)) return;

    const source = path.join(TEMPLATES_DIR, 'traefik.yml.template');
    if (!(await fileExists(source))) {
        console.warn(`⚠️ Traefik setup: static config template not found at ${source}, skipping`);
        return;
    }

    const acmeEmail = process.env.ACME_EMAIL;
    if (!acmeEmail) {
        console.warn(
            '⚠️ Traefik setup: ACME_EMAIL is not set, cannot render traefik.yml — the reverse proxy will not start',
        );
        return;
    }

    const rendered = (await fs.readFile(source, 'utf8')).replaceAll('__ACME_EMAIL__', acmeEmail);
    await fs.writeFile(target, rendered, { mode: 0o644 });
    console.log(`✓ Traefik setup: rendered static config at ${target}`);
}

export async function ensureTraefikSetup(): Promise<void> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    await fs.mkdir(path.join(TRAEFIK_SERVICE_DIR, 'certs'), { recursive: true });

    await seedDynamicConfigFiles();
    await renderStaticConfig();
}
