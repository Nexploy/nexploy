'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { SwarmService } from '@workspace/typescript-interface/docker/docker.swarm';
import { Layers } from 'lucide-react';
import { ServiceActions } from './ServiceActions';
import { CreateServiceDialog } from './CreateServiceDialog';

const DOCKER_API_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:3300';

function getReplicasBadgeVariant(running: number, total: number): 'default' | 'secondary' | 'destructive' {
    if (running === 0 && total > 0) return 'destructive';
    if (running < total) return 'secondary';
    return 'default';
}

function formatPorts(service: SwarmService): string {
    if (!service.ports || service.ports.length === 0) return '-';
    return service.ports
        .map((p) => `${p.publishedPort}:${p.targetPort}/${p.protocol}`)
        .join(', ');
}

function formatImage(image: string): string {
    const parts = image.split('@');
    const imageName = parts[0] || '';
    if (imageName.length > 50) {
        return imageName.substring(0, 47) + '...';
    }
    return imageName;
}

export function TableSwarmServices() {
    const { services, isSwarmActive } = useSwarmStore();

    if (!isSwarmActive) {
        return null;
    }

    return (
        <div className="px-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Services</h2>
                <CreateServiceDialog dockerApiUrl={DOCKER_API_URL} />
            </div>

            {services.length === 0 ? (
                <div className="bg-muted/50 rounded-lg border p-8 text-center">
                    <Layers className="text-muted-foreground mx-auto mb-4 size-12" />
                    <h3 className="text-lg font-semibold">No services found</h3>
                    <p className="text-muted-foreground text-sm">
                        Create your first service to deploy applications across the swarm.
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Replicas</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Ports</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service: SwarmService) => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{service.mode}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getReplicasBadgeVariant(
                                                service.runningReplicas,
                                                service.replicas
                                            )}
                                        >
                                            {service.runningReplicas}/{service.replicas}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className="text-muted-foreground max-w-[300px] truncate text-sm"
                                        title={service.image}
                                    >
                                        {formatImage(service.image)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatPorts(service)}
                                    </TableCell>
                                    <TableCell>
                                        <ServiceActions
                                            service={service}
                                            dockerApiUrl={DOCKER_API_URL}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
