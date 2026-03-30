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
import { ServiceActions } from './ServiceActions';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { useTranslations } from 'next-intl';

function getReplicaBadgeVariant(
    running: number,
    desired: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (desired === 0) return 'secondary';
    if (running === desired) return 'default';
    if (running === 0) return 'destructive';
    return 'secondary';
}

function formatImage(image: string): string {
    const parts = image.split('/');
    const nameTag = parts[parts.length - 1];
    if (nameTag && nameTag.length > 40) {
        return nameTag.slice(0, 37) + '...';
    }
    return nameTag || image;
}

export function ServicesTable() {
    const { services, tasks } = useSwarmStore();
    const t = useTranslations('swarm');

    const getRunningTasksCount = (serviceId: string) => {
        return tasks.filter((task) => task.serviceId === serviceId && task.state === 'running').length;
    };

    if (services.length === 0) {
        return (
            <div className="px-5">
                <div className="border-border rounded-lg border">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground font-medium">{t('noServicesFound')}</p>
                        <p className="text-muted-foreground mt-1 text-sm">{t('noServicesDescription')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5">
            <div className="border-border rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('service')}</TableHead>
                            <TableHead>{t('image')}</TableHead>
                            <TableHead>{t('mode')}</TableHead>
                            <TableHead>{t('replicas')}</TableHead>
                            <TableHead>{t('ports')}</TableHead>
                            <TableHead>{t('updateStatus')}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service: SwarmService) => {
                            const runningTasks = getRunningTasksCount(service.id);
                            return (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>
                                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                                            {formatImage(service.image)}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {service.mode === 'replicated' ? t('replicated') : t('global')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {service.mode === 'replicated' ? (
                                            <Badge
                                                variant={getReplicaBadgeVariant(
                                                    runningTasks,
                                                    service.replicas,
                                                )}
                                            >
                                                {t('tasksRunning', {
                                                    running: runningTasks,
                                                    total: service.replicas,
                                                })}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">{t('global')}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {service.ports.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {service.ports.slice(0, 3).map((port, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {port.publishedPort}:{port.targetPort}/
                                                        {port.protocol}
                                                    </Badge>
                                                ))}
                                                {service.ports.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{service.ports.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">
                                                {t('noPortsExposed')}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {service.updateStatus ? (
                                            <Badge
                                                variant={
                                                    service.updateStatus.state === 'completed'
                                                        ? 'default'
                                                        : service.updateStatus.state === 'updating'
                                                          ? 'secondary'
                                                          : 'destructive'
                                                }
                                                className="text-xs capitalize"
                                            >
                                                {service.updateStatus.state}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <ServiceActions service={service} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
