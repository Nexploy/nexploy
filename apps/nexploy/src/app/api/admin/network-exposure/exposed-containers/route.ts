import { NextResponse } from 'next/server';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { kyDocker } from '@/lib/api/kyDocker';
import { LOOPBACK_HOST_IP } from '@workspace/schemas-zod/docker/system/networkExposure.schema';
import type { ContainersPorts } from '@workspace/typescript-interface/docker/docker.containers';
import type { PubliclyExposedContainer } from '@workspace/typescript-interface/docker/docker.networkExposure';

type ContainerSummary = { id: string; name: string; ports?: ContainersPorts[] | null };

const isPubliclyBound = (port: ContainersPorts): boolean => {
    if (!port.publicPort) return false;
    if (port.hostIps.length === 0) return true;

    return port.hostIps.some((hostIp) => hostIp !== LOOPBACK_HOST_IP && hostIp !== '::1');
};

export const GET = route
    .use(authRouteServer)
    .use(requirePermission('setting', 'read'))
    .handler(async () => {
        try {
            const containers = await kyDocker.get('containers').json<ContainerSummary[]>();

            const exposed = containers.reduce<PubliclyExposedContainer[]>((accumulator, container) => {
                const publicPorts = (container.ports ?? []).filter(isPubliclyBound);
                if (publicPorts.length === 0) return accumulator;

                accumulator.push({
                    id: container.id,
                    name: container.name.replace(/^\//, ''),
                    ports: publicPorts.map((port) => ({
                        publicPort: port.publicPort,
                        privatePort: port.privatePort,
                        type: port.type,
                    })),
                });

                return accumulator;
            }, []);

            return NextResponse.json({ containers: exposed });
        } catch {
            const t = await getErrorTranslator();
            return NextResponse.json({ error: t('networkExposure.getExposedFailed') }, { status: 500 });
        }
    });
