'use client';

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { Bug, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useEventsStore } from '@/stores/docker/useEventsStore';
import { useState } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { DockerEventData } from '@workspace/typescript-interface/docker/docker.events';
import { useTranslations } from 'next-intl';

export default function EventsPage() {
    const t = useTranslations('docker');
    const tCommon = useTranslations('common');

    const {
        filteredEvents,
        lastUpdate,
        eventsReceived,
        searchQuery,
        typeFilter,
        setSearchQuery,
        setTypeFilter,
    } = useEventsStore();

    const [pageSize, setPageSize] = useState<number | 'all'>(PAGE_SIZE_DEFAULT);
    const [currentPage, setCurrentPage] = useState(0);

    const isLoading = !lastUpdate;

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0);
    };

    const handleTypeFilterChange = (value: string) => {
        setTypeFilter(value);
        setCurrentPage(0);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'start':
            case 'create':
            case 'pull':
            case 'load':
            case 'import':
            case 'connect':
                return 'default';
            case 'stop':
            case 'pause':
            case 'disconnect':
                return 'secondary';
            case 'destroy':
            case 'delete':
            case 'die':
            case 'kill':
            case 'remove':
                return 'destructive';
            case 'restart':
            case 'unpause':
            case 'update':
            case 'rename':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'container':
                return 'default';
            case 'image':
                return 'secondary';
            case 'network':
                return 'outline';
            case 'volume':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getEventName = (event: DockerEventData) => {
        const name = event.Actor.Attributes?.name;
        const id = event.Actor.ID;

        if (name) return name;
        if (id) return id.substring(0, 12);
        return 'Unknown';
    };

    const getLocaleDate = (timestamp: number) => {
        return dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss');
    };

    const isShowingAll = pageSize === 'all';
    const totalPages = isShowingAll ? 1 : Math.ceil(filteredEvents.length / (pageSize as number));
    const startIndex = isShowingAll ? 0 : currentPage * (pageSize as number);
    const endIndex = isShowingAll ? filteredEvents.length : startIndex + (pageSize as number);
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className={'flex gap-3 px-5'}>
                <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <Bug className="text-primary size-7" />
                </div>
                <div className="mt-3.5 flex flex-col">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Docker {t('eventsTitle')}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {eventsReceived > 0
                            ? t('eventsReceived', { count: eventsReceived })
                            : t('waitingForEvents')}
                    </p>
                </div>
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className={'space-y-3 pt-1 pb-5'}>
                    <div className={'mx-5 flex flex-wrap justify-between gap-3'}>
                        <Input
                            className={'w-56 shadow-xs'}
                            placeholder={t('searchByNameAction')}
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('type')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('type')}</SelectLabel>
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    <SelectItem value="container">{t('container')}</SelectItem>
                                    <SelectItem value="image">{t('image')}</SelectItem>
                                    <SelectItem value="network">{t('network')}</SelectItem>
                                    <SelectItem value="volume">{t('volume')}</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-card mx-5 overflow-hidden rounded-md border shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('timestamp')}</TableHead>
                                    <TableHead>{t('type')}</TableHead>
                                    <TableHead>{t('action')}</TableHead>
                                    <TableHead>{t('nameId')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading &&
                                    Array.from({ length: 10 }).map((_, rowIndex) => (
                                        <TableRow key={rowIndex} className="h-12">
                                            {Array.from({ length: 4 }).map((_, index) => (
                                                <TableCell key={index}>
                                                    <Skeleton className="h-6 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}

                                {!isLoading && !paginatedEvents.length ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-6 text-center">
                                            {filteredEvents.length === 0 && eventsReceived === 0
                                                ? t('waitingForEvents')
                                                : t('noMatchingEvents')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedEvents.map((event, index) => {
                                        const timestamp =
                                            event.time * 1000 || event.timeNano / 1000000;
                                        return (
                                            <TableRow
                                                key={`${event.Actor.ID}-${event.Action}-${index}`}
                                                className={'h-12'}
                                            >
                                                <TableCell className="text-muted-foreground font-mono text-sm">
                                                    {getLocaleDate(timestamp)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getTypeColor(event.Type)}>
                                                        {event.Type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getActionColor(event.Action)}>
                                                        <span className={'max-w-80 truncate'}>
                                                            {event.Action}
                                                        </span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-60 truncate font-mono text-sm font-medium">
                                                    {getEventName(event)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {!isLoading && !!filteredEvents.length && (
                        <div className={'mx-5 flex items-center justify-between'}>
                            <div className={'flex items-center gap-2'}>
                                <span className="text-muted-foreground text-sm">
                                    {t('eventsPerPage')}:
                                </span>
                                <Select
                                    value={pageSize === 'all' ? 'all' : String(pageSize)}
                                    onValueChange={(value) => {
                                        if (value === 'all') {
                                            setPageSize('all');
                                        } else {
                                            setPageSize(Number(value));
                                        }
                                        setCurrentPage(0);
                                    }}
                                >
                                    <SelectTrigger size={'sm'} className="min-w-24">
                                        <SelectValue placeholder={t('eventsPerPage')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{tCommon('size')}</SelectLabel>
                                            {PAGE_SIZE_OPTIONS.map((size) => (
                                                <SelectItem key={size} value={`${size}`}>
                                                    {size}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="all">{t('all')}</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            {!isShowingAll && (
                                <div className={'flex items-center gap-2'}>
                                    <span className="text-muted-foreground text-sm">
                                        {tCommon('pageOf', {
                                            current: currentPage + 1,
                                            total: totalPages,
                                        })}
                                    </span>
                                    <div className={'flex gap-2'}>
                                        <Button
                                            variant={'outline'}
                                            size={'sm'}
                                            onClick={() =>
                                                setCurrentPage((p) => Math.max(0, p - 1))
                                            }
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className={'h-4 w-4'} />
                                            {tCommon('previous')}
                                        </Button>
                                        <Button
                                            variant={'outline'}
                                            size={'sm'}
                                            onClick={() =>
                                                setCurrentPage((p) =>
                                                    Math.min(totalPages - 1, p + 1),
                                                )
                                            }
                                            disabled={currentPage >= totalPages - 1}
                                        >
                                            {tCommon('next')}
                                            <ChevronRight className={'h-4 w-4'} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
