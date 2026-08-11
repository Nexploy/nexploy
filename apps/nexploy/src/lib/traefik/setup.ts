import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { TRAEFIK_SERVICE_DIR } from './paths';
import { disableUpgradeOverride } from './upgradeOverride';
import { resolveInstanceTlsMode } from '@/lib/instance/tlsMode';

const TEMPLATES_DIR = process.env.TRAEFIK_TEMPLATES_DIR ?? path.join(process.cwd(), 'traefik-templates');

const SEED_FILES = ['middlewares.yml', 'routers.yml', 'maintenance.yml', 'upgrading.yml'];

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

interface StaticConfig {
    entryPoints?: Record<string, { http?: { tls?: Record<string, unknown> } }>;
    certificatesResolvers?: Record<string, { acme?: { email?: string } }>;
}

function renderCustomTlsConfig(template: string, acmeEmail: string | undefined): string {
    const parsed = (yaml.parse(template) ?? {}) as StaticConfig;

    const websecureTls = parsed.entryPoints?.websecure?.http?.tls;
    if (websecureTls) delete websecureTls.certResolver;

    if (acmeEmail && parsed.certificatesResolvers?.letsencrypt?.acme) {
        parsed.certificatesResolvers.letsencrypt.acme.email = acmeEmail;
    } else {
        delete parsed.certificatesResolvers;
    }

    return yaml.stringify(parsed);
}

async function renderStaticConfig(): Promise<void> {
    const target = process.env.TRAEFIK_STATIC_CONFIG_PATH;
    if (!target) return;
    if (await fileExists(target)) {
        await ensureWebsecureEntryPoint(target);
        return;
    }

    const mode = resolveInstanceTlsMode();
    const templateName = mode === 'ip' ? 'traefik.no-tls.yml.template' : 'traefik.yml.template';
    const source = path.join(TEMPLATES_DIR, templateName);
    if (!(await fileExists(source))) {
        console.warn(`⚠️ Traefik setup: static config template not found at ${source}, skipping`);
        return;
    }

    const acmeEmail = process.env.ACME_EMAIL;
    let rendered = await fs.readFile(source, 'utf8');

    if (mode === 'letsencrypt') {
        if (!acmeEmail) {
            console.warn(
                '⚠️ Traefik setup: ACME_EMAIL is not set, cannot render traefik.yml — the reverse proxy will not start',
            );
            return;
        }
        rendered = rendered.replaceAll('__ACME_EMAIL__', acmeEmail);
    }

    if (mode === 'custom') {
        rendered = renderCustomTlsConfig(rendered, acmeEmail);
    }

    await fs.writeFile(target, rendered, { mode: 0o644 });
    console.log(`✓ Traefik setup: rendered static config (${templateName}, TLS mode: ${mode}) at ${target}`);
}

async function syncCustomCertificates(): Promise<void> {
    try {
        const { regenerateCustomCertsConfig } = await import('./customCerts');
        await regenerateCustomCertsConfig();
    } catch (error) {
        console.warn('⚠️ Traefik setup: could not refresh the custom certificates config', error);
    }
}

export async function ensureTraefikSetup(): Promise<void> {
    await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
    await fs.mkdir(path.join(TRAEFIK_SERVICE_DIR, 'certs'), { recursive: true });

    await disableUpgradeOverride();
    await seedDynamicConfigFiles();
    await renderStaticConfig();
    await syncCustomCertificates();
}
