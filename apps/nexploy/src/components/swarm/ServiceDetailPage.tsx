'use client';

import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowLeft, Clock, Layers } from 'lucide-react';
import { ServiceDetailStats } from './detail/ServiceDetailStats';
import { ServiceDetailInfo } from './detail/ServiceDetailInfo';
import { ServiceDetailTasks } from './detail/ServiceDetailTasks';
import { ServiceDetailConfig } from './detail/ServiceDetailConfig';
import { ServiceDetailLabels } from './detail/ServiceDetailLabels';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';
import { Button } from '@workspace/ui/components/button.tsx';
import Link from 'next/link';
import { Badge } from '@workspace/ui/components/badge.tsx';

interface ServiceDetailPageProps {
    serviceId: string;
}

export function ServiceDetailPage({ serviceId }: ServiceDetailPageProps) {
    const t = useTranslations('swarm');

    const service = useSwarmServiceStore((s) => s.service);
    const tasks = useSwarmServiceStore((s) => s.tasks);
    const notFound = useSwarmServiceStore((s) => s.notFound);
    const isConnecting = useSwarmServiceStore((s) => s.isConnecting);

    const serviceName = service?.name || serviceId.substring(0, 12);

    if (notFound) {
        return (
            <NotFoundSSE
                title={t('detail.notFound')}
                description={t('detail.notFoundDescription')}
                backLabel={t('detail.back')}
            />
        );
    }

    if (isConnecting) {
        return (
            <BreadcrumbProvider segments={{ serviceId: serviceName }}>
                <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                    <div className="flex gap-3 px-5">
                        <Skeleton className="size-12 rounded-lg" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-8 w-52" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <div className="px-5">
                        <Skeleton className="h-64" />
                    </div>
                </div>
            </BreadcrumbProvider>
        );
    }

    if (!service) return null;

    return (
        <BreadcrumbProvider segments={{ serviceId: serviceName }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Layers className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex flex-col">
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    {service.name}
                                </h1>
                                <p className="text-muted-foreground font-mono text-sm">
                                    {service.id.slice(0, 12)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Badge variant="outline" className="capitalize">
                                {service.mode}
                            </Badge>
                            {service.updateStatus && (
                                <Badge
                                    variant={
                                        service.updateStatus.state === 'completed'
                                            ? 'default'
                                            : service.updateStatus.state === 'updating'
                                              ? 'secondary'
                                              : 'destructive'
                                    }
                                    className="capitalize"
                                >
                                    {service.updateStatus.state}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/swarm">
                            <ArrowLeft className="size-4" />
                            {t('detail.back')}
                        </Link>
                    </Button>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="space-y-6 px-5 pb-5">
                        <ServiceDetailStats service={service} tasks={tasks} />
                        <ServiceDetailInfo service={service} />
                        <ServiceDetailTasks tasks={tasks} />
                        <ServiceDetailConfig service={service} />
                        <ServiceDetailLabels labels={service.labels ?? {}} />
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <Clock className="size-3" />
                            {t('detail.updatedAt')}: {new Date(service.updatedAt).toLocaleString()}
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
