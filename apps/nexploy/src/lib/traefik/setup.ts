import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
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

async function ensureWebsecureEntryPoint(target: string): Promise<void> {
    const content = await fs.readFile(target, 'utf8');
    const parsed = yaml.parse(content) as { entryPoints?: Record<string, unknown> } | null;

    if (!parsed?.entryPoints || parsed.entryPoints.websecure) return;

    parsed.entryPoints.websecure = { address: ':443', http3: {} };
    await fs.writeFile(target, yaml.stringify(parsed), { mode: 0o644 });
    console.log(`✓ Traefik setup: patched missing 'websecure' entryPoint into ${target}`);
}

async function renderStaticConfig(): Promise<void> {
    const target = process.env.TRAEFIK_STATIC_CONFIG_PATH;
    if (!target) return;
    if (await fileExists(target)) {
        await ensureWebsecureEntryPoint(target);
        return;
    }

    const useTls = process.env.TRAEFIK_USE_TLS !== 'false';
    const templateName = useTls ? 'traefik.yml.template' : 'traefik.no-tls.yml.template';
    const source = path.join(TEMPLATES_DIR, templateName);
    if (!(await fileExists(source))) {
        console.warn(`⚠️ Traefik setup: static config template not found at ${source}, skipping`);
        return;
    }

    let rendered = await fs.readFile(source, 'utf8');

    if (useTls) {
        const acmeEmail = process.env.ACME_EMAIL;
        if (!acmeEmail) {
            console.warn(
                '⚠️ Traefik setup: ACME_EMAIL is not set, cannot render traefik.yml — the reverse proxy will not start',
            );
            return;
        }
        rendered = rendered.replaceAll('__ACME_EMAIL__', acmeEmail);
    }

    await fs.writeFile(target, rendered, { mode: 0o644 });
    console.log(`✓ Traefik setup: rendered static config (${templateName}) at ${target}`);
}

export async function ensureTraefikSetup(): Promise<void> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    await fs.mkdir(path.join(TRAEFIK_SERVICE_DIR, 'certs'), { recursive: true });

    await seedDynamicConfigFiles();
    await renderStaticConfig();
}
