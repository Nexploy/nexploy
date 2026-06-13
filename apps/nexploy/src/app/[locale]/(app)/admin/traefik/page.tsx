import * as fs from 'fs/promises';
import * as path from 'path';
import type { Metadata } from 'next';
import { TraefikConfigProvider } from '@/stores/admin/TraefikConfigProvider';
import { TraefikConfigPage } from '@/components/admin/traefik/TraefikConfigPage';

const TRAEFIK_SERVICE_DIR = path.join(process.cwd(), '..', '..', 'infra', 'traefik', 'service');

export const metadata: Metadata = {
    title: 'Traefik Configuration',
    description: 'Manage Traefik reverse proxy configuration files',
};

export default async function TraefikPage() {
    let files: { name: string }[] = [];
    try {
        await fs.mkdir(TRAEFIK_SERVICE_DIR, { recursive: true });
        const entries = await fs.readdir(TRAEFIK_SERVICE_DIR, { withFileTypes: true });
        files = entries
            .filter((e) => e.isFile() && e.name.endsWith('.yml'))
            .map((e) => ({ name: e.name }));
    } catch {}

    return (
        <TraefikConfigProvider initialFiles={files}>
            <TraefikConfigPage />
        </TraefikConfigProvider>
    );
}
