'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Container as IconContainer, MoreVertical } from 'lucide-react';
import { useTransition } from 'react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { ContainersDropdownActions } from '@/components/docker/containers/ContainersDropdownActions';
import Link from 'next/link';
import { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import { containerDisplayState } from '@/utils/containerDisplayState';
import { Badge } from '@workspace/ui/components/badge';
import { Carousel, CarouselContent, CarouselItem } from '@workspace/ui/components/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useTranslations } from 'next-intl';

interface ContainerCardProps {
    container: Containers;
}

export function ContainerCard({ container }: ContainerCardProps) {
    const [isPending] = useTransition();
    const t = useTranslations('docker.containerCard');

    const containerName = container.name;
    const containerState = container.state;
    const containerId = container.id;

    const containerStatus = container.status;

    return (
        <Link href={`/docker/containers/${containerId}`}>
            <Card className="relative cursor-pointer rounded-xl border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
                <CardHeader className="flex">
                    <div className="flex flex-1 items-center gap-3 truncate">
                        <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                            <IconContainer className="text-primary size-5" />
                        </div>
                        <CardTitle className="truncate text-lg font-semibold">
                            {containerName}
                        </CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isPending}>
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <ContainersDropdownActions
                            containerId={container.id}
                            containerName={containerName}
                            containerState={containerState}
                        />
                    </DropdownMenu>
                </CardHeader>

                <Status
                    className={'bg-card absolute -top-2 -right-2 truncate rounded-md'}
                    status={containerDisplayState[containerState] ?? 'offline'}
                    variant="outline"
                >
                    <StatusIndicator />
                    <StatusLabel className="truncate font-mono">{containerStatus}</StatusLabel>
                </Status>

                <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2 truncate">
                        <span className="font-medium">{t('image')}</span>
                        <code className="bg-muted/50 truncate rounded-md px-3 py-1 text-sm">
                            {container.image}
                        </code>
                    </div>

                    <div className={'flex flex-col gap-2'}>
                        <div className={'flex items-center justify-between'}>
                            <p>{t('ports')}</p>
                            <Badge>{container.ports.length}</Badge>
                        </div>{' '}
                        {container.ports.length ? (
                            <Carousel
                                plugins={[
                                    Autoplay({
                                        delay: 3000,
                                    }),
                                ]}
                                opts={{ align: 'start', loop: true }}
                                className="w-full max-w-xs"
                            >
                                <CarouselContent>
                                    {container.ports.map((p, idx) => (
                                        <CarouselItem key={idx}>
                                            <code className="bg-muted/50 flex shrink-0 gap-2 rounded-md px-3 py-2 text-start text-xs leading-none">
                                                {p.publicPort !== 0 ? p.publicPort : '—'} →{' '}
                                                {p.privatePort}
                                                <span className="text-muted-foreground">
                                                    ({p.type})
                                                </span>
                                            </code>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        ) : (
                            <span className="text-muted-foreground">{t('noPorts')}</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
