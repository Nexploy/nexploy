'use client';

import { Bug, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { StatusDocker } from '@/components/docker/StatusDocker';
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

export default function EventsPage() {
    const {
        filteredEvents,
        lastUpdate,
        eventsReceived,
        searchQuery,
        typeFilter,
        setSearchQuery,
        setTypeFilter,
    } = useEventsStore();

    const [pageSize, setPageSize] = useState<number | 'all'>(25);
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
        return new Date(timestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const isShowingAll = pageSize === 'all';
    const totalPages = isShowingAll ? 1 : Math.ceil(filteredEvents.length / (pageSize as number));
    const startIndex = isShowingAll ? 0 : currentPage * (pageSize as number);
    const endIndex = isShowingAll ? filteredEvents.length : startIndex + (pageSize as number);
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Bug className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <div className={'flex items-center gap-3'}>
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                Docker Events
                            </h1>
                            <StatusDocker />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {eventsReceived > 0
                                ? `${eventsReceived} événements reçus`
                                : "En attente d'événements..."}
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'space-y-3 pb-5'}>
                        <div className={'mx-5 flex justify-between gap-3'}>
                            <Input
                                className={'w-1/4 shadow-xs'}
                                placeholder="Rechercher par nom, action..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Type</SelectLabel>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="container">Container</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="network">Network</SelectItem>
                                        <SelectItem value="volume">Volume</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-card mx-5 overflow-hidden rounded-md border shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Nom / ID</TableHead>
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
                                                    ? "En attente d'événements Docker..."
                                                    : 'Aucun événement ne correspond aux filtres.'}
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
                                                        <Badge
                                                            variant={getActionColor(event.Action)}
                                                        >
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
                                        Événements par page :
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
                                        <SelectTrigger size={'sm'} className="w-24">
                                            <SelectValue placeholder="Events per page" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Taille</SelectLabel>
                                                {[10, 25, 50, 100].map((size) => (
                                                    <SelectItem key={size} value={`${size}`}>
                                                        {size}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="all">Tous</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!isShowingAll && (
                                    <div className={'flex items-center gap-2'}>
                                        <span className="text-muted-foreground text-sm">
                                            Page {currentPage + 1} sur {totalPages}
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
                                                Précédent
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
                                                Suivant
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
        </div>
    );
}
