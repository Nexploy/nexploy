'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeft, Layers } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';

interface ServiceDetailHeaderProps {
    service: SwarmService;
}

export function ServiceDetailHeader({ service }: ServiceDetailHeaderProps) {
    const t = useTranslations('swarm');

    return (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div className="flex gap-3">
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <Layers className="text-primary size-7" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {service.name}
                        </h1>
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
                    <p className="text-muted-foreground font-mono text-sm">
                        {service.id.slice(0, 12)}
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline" size="sm">
                    <Link href="/swarm">
                        <ArrowLeft className="size-4" />
                        {t('detail.back')}
                    </Link>
                </Button>
                {/*<ServiceActions service={service} />*/}
            </div>
        </div>
    );
}
