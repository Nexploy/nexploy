'use client';

import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { useTranslations } from 'next-intl';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Link } from '@/i18n/navigation';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { ServiceDetailHeader } from './detail/ServiceDetailHeader';
import { ServiceDetailStats } from './detail/ServiceDetailStats';
import { ServiceDetailInfo } from './detail/ServiceDetailInfo';
import { ServiceDetailTasks } from './detail/ServiceDetailTasks';
import { ServiceDetailConfig } from './detail/ServiceDetailConfig';
import { ServiceDetailLabels } from './detail/ServiceDetailLabels';

interface ServiceDetailPageProps {
    serviceId: string;
}

export function ServiceDetailPage({ serviceId }: ServiceDetailPageProps) {
    const t = useTranslations('swarm');

    const service = useSwarmStore((s) => s.getService(serviceId));
    const getTasksByService = useSwarmStore((s) => s.getTasksByService);
    const lastUpdate = useSwarmStore((s) => s.lastUpdate);

    const isLoading = !lastUpdate;

    if (isLoading) {
        return (
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
        );
    }

    if (!service) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-destructive/10">
                            <AlertCircle className="text-destructive" />
                        </EmptyMedia>
                        <EmptyTitle>{t('detail.notFound')}</EmptyTitle>
                        <EmptyDescription>{t('detail.notFoundDescription')}</EmptyDescription>
                    </EmptyHeader>
                    <Button asChild variant="outline">
                        <Link href="/swarm">
                            <ArrowLeft className="size-4" />
                            {t('detail.back')}
                        </Link>
                    </Button>
                </Empty>
            </div>
        );
    }

    const tasks = getTasksByService(serviceId);

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <ServiceDetailHeader service={service} />
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
    );
}
