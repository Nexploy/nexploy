'use client';

import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ArrowLeft, Layers, MoreHorizontal } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { ServiceDropdownActions } from './ServiceDropdownActions';

interface ServiceDetailPageProps {
    serviceId: string;
}

export function ServiceDetailPage({ serviceId }: ServiceDetailPageProps) {
    const t = useTranslations('swarm');

    const service = useSwarmServiceStore((s) => s.service);
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

    return (
        <BreadcrumbProvider segments={{ serviceId: serviceName }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Layers className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-1 flex-col">
                        {isConnecting ? (
                            <>
                                <Skeleton className="h-8 w-52" />
                                <Skeleton className="mt-1 h-4 w-36" />
                            </>
                        ) : (
                            <div className="flex flex-col">
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    {service?.name}
                                </h1>
                                {service && (
                                    <div className="mt-0.5 flex gap-1.5">
                                        <Badge variant="outline" className="py-0 capitalize">
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
                                                className="py-0 capitalize"
                                            >
                                                {service.updateStatus.state}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-5 flex shrink-0 gap-2">
                        <Button asChild variant="outline">
                            <Link href="/swarm">
                                <ArrowLeft className="size-4" />
                                {t('detail.back')}
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={isConnecting || !service}
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            {service && <ServiceDropdownActions service={service} />}
                        </DropdownMenu>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-8 pb-5">
                        <div className="space-y-5 px-5">
                            <ServiceDetailStats />
                            <ServiceDetailInfo />
                            <ServiceDetailTasks />
                            <ServiceDetailConfig />
                            <ServiceDetailLabels />
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
