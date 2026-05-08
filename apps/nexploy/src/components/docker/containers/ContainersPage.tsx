'use client';

import {
    Container as IconContainer,
    Container,
    Layers,
    LayoutGrid,
    Plus,
    Table2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { ContainersStack } from '@/components/docker/containers/ContainersStack';
import { ContainersStandalone } from '@/components/docker/containers/ContainersStandalone';
import { TableDockerContainers } from '@/components/docker/containers/TableDockerContainers';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { useLocalStorage } from 'usehooks-ts';

export default function ContainersPage() {
    const t = useTranslations('docker');
    const tNav = useTranslations('navigation');

    const [viewMode, setViewMode] = useLocalStorage<'grid' | 'table'>('container-viewMode', 'grid');

    const lastUpdate = useContainersStore((state) => state.lastUpdate);
    const containers = useContainersStore((state) => state.containers);
    const getOrganizedContainers = useContainersStore((state) => state.getOrganizedContainers);
    const { stacks, standaloneContainers } = getOrganizedContainers();
    const stacksSize = stacks.size;
    const standaloneContainersLenght = standaloneContainers.length;

    const numberOfStackAndStandaloneContainer = stacksSize + standaloneContainersLenght;

    const allStackContainers = Array.from(stacks.values()).flat();

    const tabs = [
        {
            id: 'all',
            label: t('all'),
            icon: LayoutGrid,
            count: numberOfStackAndStandaloneContainer,
        },
        {
            id: 'stacks',
            label: tNav('stacks'),
            icon: Layers,
            count: stacksSize,
        },
        {
            id: 'containers',
            label: tNav('containers'),
            icon: Container,
            count: standaloneContainersLenght,
        },
    ];

    const isLoading = !containers.length && !lastUpdate;
    const isEmpty = !containers.length && lastUpdate;

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className="flex justify-between gap-2 px-5">
                <div className={'flex gap-3'}>
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Container className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            {tNav('dockerContainers')}
                        </h1>
                        {isLoading ? (
                            <Skeleton className={'my-1 h-3 w-40'} />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                {numberOfStackAndStandaloneContainer === 0 ? (
                                    t('noContainers')
                                ) : (
                                    <>
                                        {standaloneContainersLenght} {t('container')}
                                        {stacksSize > 0 && ` · ${stacksSize} ${t('stack.title')}`}
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </div>
                <Button asChild className={'mt-5'}>
                    <Link href={'/docker/containers/create'}>
                        <Plus />
                        {t('createContainer.create')}
                    </Link>
                </Button>
            </div>

            {isLoading && (
                <div className="mb-6 flex flex-1 flex-col gap-5">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="mx-6 flex-1" />
                    ))}
                </div>
            )}

            {isEmpty && (
                <Empty className="mb-32">
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-primary/10">
                            <IconContainer className="text-primary" />
                        </EmptyMedia>
                        <EmptyTitle>{t('noContainers')}</EmptyTitle>
                        <EmptyDescription>{t('noContainersDescription')}</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}

            {!isLoading && !isEmpty && (
                <Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue="all">
                    <div className="mx-5 mb-2 flex items-center justify-between gap-2">
                        <TabsList>
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="flex flex-1 gap-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <tab.icon />
                                        <span>{tab.label}</span>
                                    </div>
                                    <Badge className="rounded-full" variant="secondary">
                                        {tab.count}
                                    </Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex items-center gap-1 rounded-lg border p-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', viewMode === 'grid' && 'bg-muted')}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('viewGrid')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', viewMode === 'table' && 'bg-muted')}
                                        onClick={() => setViewMode('table')}
                                    >
                                        <Table2 className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('viewTable')}</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="pb-5">
                            {viewMode === 'grid' ? (
                                <>
                                    <TabsContent value="all" className="flex flex-col space-y-4">
                                        {stacksSize ? <ContainersStack /> : null}
                                        <ContainersStandalone />
                                    </TabsContent>
                                    <TabsContent value="stacks">
                                        <ContainersStack />
                                    </TabsContent>
                                    <TabsContent value="containers">
                                        <ContainersStandalone keepEmpty />
                                    </TabsContent>
                                </>
                            ) : (
                                <>
                                    <TabsContent value="all">
                                        <TableDockerContainers
                                            containers={containers}
                                            isLoading={isLoading}
                                        />
                                    </TabsContent>
                                    <TabsContent value="stacks">
                                        <TableDockerContainers
                                            containers={allStackContainers}
                                            isLoading={isLoading}
                                        />
                                    </TabsContent>
                                    <TabsContent value="containers">
                                        <TableDockerContainers
                                            containers={standaloneContainers}
                                            isLoading={isLoading}
                                        />
                                    </TabsContent>
                                </>
                            )}
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            )}
        </div>
    );
}
