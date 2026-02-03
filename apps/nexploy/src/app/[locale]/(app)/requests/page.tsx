'use client';

import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useRequestsStore } from '@/stores/traefik/useRequestsStore';
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
import { SSEProvider } from '@/providers/SSEProviders';
import { useLocale, useTranslations } from 'next-intl';

export default function RequestsPage() {
    const t = useTranslations('requests');
    const locale = useLocale();
    const {
        filteredRequests,
        requests,
        lastUpdate,
        searchQuery,
        methodFilter,
        statusFilter,
        setSearchQuery,
        setMethodFilter,
        setStatusFilter,
    } = useRequestsStore();

    const [pageSize, setPageSize] = useState<number | 'all'>(25);
    const [currentPage, setCurrentPage] = useState(0);

    const isLoading = !lastUpdate;

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0);
    };

    const handleMethodFilterChange = (value: string) => {
        setMethodFilter(value);
        setCurrentPage(0);
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(0);
    };

    const getMethodColor = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'default';
            case 'POST':
                return 'secondary';
            case 'PUT':
            case 'PATCH':
                return 'outline';
            case 'DELETE':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'default';
        if (status >= 300 && status < 400) return 'secondary';
        if (status >= 400 && status < 500) return 'outline';
        if (status >= 500) return 'destructive';
        return 'secondary';
    };

    const formatDuration = (ms: number) => {
        if (ms < 1) return '<1ms';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '-';
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    const getLocaleDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const isShowingAll = pageSize === 'all';
    const totalPages = isShowingAll ? 1 : Math.ceil(filteredRequests.length / (pageSize as number));
    const startIndex = isShowingAll ? 0 : currentPage * (pageSize as number);
    const endIndex = isShowingAll ? filteredRequests.length : startIndex + (pageSize as number);
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    const getRequestsStatusText = () => {
        if (isLoading) {
            return t('waitingForRequests');
        }
        if (requests.length === 0) {
            return t('noRequests');
        }
        return requests.length > 1
            ? t('requestsCapturedPlural', { count: requests.length })
            : t('requestsCaptured', { count: requests.length });
    };

    return (
        <SSEProvider connections={['traefik']}>
            <div className="flex h-full flex-1 flex-col gap-4 pt-5">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Send className="text-primary size-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{getRequestsStatusText()}</p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="space-y-3 pt-1 pb-5">
                        <div className="mx-5 flex justify-between gap-3">
                            <Input
                                className="w-1/4 shadow-xs"
                                placeholder={t('searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Select
                                    value={methodFilter}
                                    onValueChange={handleMethodFilterChange}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder={t('method')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('method')}</SelectLabel>
                                            <SelectItem value="all">{t('allMethods')}</SelectItem>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                            <SelectItem value="PUT">PUT</SelectItem>
                                            <SelectItem value="PATCH">PATCH</SelectItem>
                                            <SelectItem value="DELETE">DELETE</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={statusFilter}
                                    onValueChange={handleStatusFilterChange}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder={t('status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('status')}</SelectLabel>
                                            <SelectItem value="all">{t('allStatuses')}</SelectItem>
                                            <SelectItem value="2xx">{t('success2xx')}</SelectItem>
                                            <SelectItem value="3xx">{t('redirect3xx')}</SelectItem>
                                            <SelectItem value="4xx">
                                                {t('clientError4xx')}
                                            </SelectItem>
                                            <SelectItem value="5xx">
                                                {t('serverError5xx')}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="bg-card mx-5 overflow-hidden rounded-md border shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-36">
                                            {t('table.timestamp')}
                                        </TableHead>
                                        <TableHead className="w-20">{t('table.method')}</TableHead>
                                        <TableHead>{t('table.path')}</TableHead>
                                        <TableHead className="w-20">{t('table.status')}</TableHead>
                                        <TableHead className="w-24">
                                            {t('table.duration')}
                                        </TableHead>
                                        <TableHead className="w-20">{t('table.size')}</TableHead>
                                        <TableHead>{t('table.service')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading &&
                                        Array.from({ length: 10 }).map((_, rowIndex) => (
                                            <TableRow key={rowIndex} className="h-12">
                                                {Array.from({ length: 7 }).map((_, index) => (
                                                    <TableCell key={index}>
                                                        <Skeleton className="h-6 w-full" />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}

                                    {!isLoading && !paginatedRequests.length ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-6 text-center">
                                                {requests.length === 0
                                                    ? t('noRequests')
                                                    : t('noMatchingRequests')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedRequests.map((request) => (
                                            <TableRow key={request.id} className="h-12">
                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                    {getLocaleDate(request.timestamp)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getMethodColor(request.method)}
                                                        className="font-mono text-xs"
                                                    >
                                                        {request.method}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell
                                                    className="max-w-80 truncate font-mono text-sm"
                                                    title={request.path}
                                                >
                                                    {request.path}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getStatusColor(request.status)}
                                                        className="font-mono"
                                                    >
                                                        {request.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-sm">
                                                    {formatDuration(request.duration)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-sm">
                                                    {formatSize(request.size)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground max-w-40 truncate text-sm">
                                                    {request.serviceName || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {!isLoading && !!filteredRequests.length && (
                            <div className="mx-5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-sm">
                                        {t('requestsPerPage')}
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
                                        <SelectTrigger size="sm" className="w-24">
                                            <SelectValue placeholder={t('perPage')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t('sizeLabel')}</SelectLabel>
                                                {[10, 25, 50, 100].map((size) => (
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-sm">
                                            {t('pageOf', {
                                                current: currentPage + 1,
                                                total: totalPages,
                                            })}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage((p) => Math.max(0, p - 1))
                                                }
                                                disabled={currentPage === 0}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                {t('previous')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.min(totalPages - 1, p + 1),
                                                    )
                                                }
                                                disabled={currentPage >= totalPages - 1}
                                            >
                                                {t('next')}
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </SSEProvider>
    );
}
