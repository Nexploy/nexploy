import type { Metadata } from 'next';
import { TraefikConfigProvider } from '@/stores/traefik/TraefikConfigProvider';
import { TraefikConfigPage } from '@/components/traefik/config/TraefikConfigPage';
import { readTraefikTree } from '@/lib/traefik/fileTree';
import type { TraefikTreeNode } from '@/lib/traefik/types';

export const metadata: Metadata = {
    title: 'Traefik Configuration',
    description: 'Manage Traefik reverse proxy configuration files',
};

export default async function TraefikPage() {
    let tree: TraefikTreeNode[] = [];
    try {
        tree = await readTraefikTree();
    } catch {}

    return (
        <TraefikConfigProvider initialTree={tree}>
            <TraefikConfigPage />
        </TraefikConfigProvider>
    );
}
