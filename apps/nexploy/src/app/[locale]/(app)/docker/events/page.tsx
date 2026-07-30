'use client';

import { Bug } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useEventsStore } from '@/stores/docker/useEventsStore';
import { useMemo } from 'react';
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
import { useTranslations } from 'next-intl';
import { TableDockerEvents } from '@/components/docker/events/TableDockerEvents';

export default function EventsPage() {
    const t = useTranslations('docker');

    const {
        events,
        filteredEvents,
        lastUpdate,
        eventsReceived,
        searchQuery,
        typeFilter,
        nameFilter,
        setSearchQuery,
        setTypeFilter,
        setNameFilter,
        getAvailableNames,
    } = useEventsStore();

    const isLoading = !lastUpdate;

    const availableNames = useMemo(() => getAvailableNames(), [events, typeFilter]);

    const emptyLabel =
        filteredEvents.length === 0 && eventsReceived === 0
            ? t('waitingForEvents')
            : t('noMatchingEvents');

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
                <div className={'space-y-3 pb-5 pt-1'}>
                    <div className={'mx-5 flex flex-wrap justify-between gap-3'}>
                        <Input
                            className={'shadow-xs w-56'}
                            placeholder={t('searchByNameAction')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className={'flex flex-wrap gap-3'}>
                            <Select
                                value={nameFilter}
                                onValueChange={setNameFilter}
                                disabled={!availableNames.length}
                            >
                                <SelectTrigger className={'min-w-40 max-w-56'}>
                                    <SelectValue placeholder={t('nameId')} />
                                </SelectTrigger>
                                <SelectContent className={'max-h-72'}>
                                    <SelectGroup>
                                        <SelectLabel>{t('nameId')}</SelectLabel>
                                        <SelectItem value="all">{t('allNames')}</SelectItem>
                                        {availableNames.map((name) => (
                                            <SelectItem key={name} value={name}>
                                                <span className={'truncate font-mono text-sm'}>
                                                    {name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className={'min-w-40 max-w-56'}>
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
                    </div>

                    <TableDockerEvents
                        events={filteredEvents}
                        isLoading={isLoading}
                        emptyLabel={emptyLabel}
                    />
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
