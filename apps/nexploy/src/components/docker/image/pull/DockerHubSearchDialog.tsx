'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWRInfinite from 'swr/infinite';
import { BadgeCheck, Download, Search, Star } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Spinner } from '@workspace/ui/components/spinner';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow.tsx';
import { cn } from '@workspace/ui/lib/utils.ts';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { DockerHubImage, DockerHubSort, } from '@workspace/typescript-interface/docker/docker.hub';
import { ImageLogo } from '@/components/docker/image/pull/ImageLogo.tsx';

type SourceFilter = 'all' | 'official';

const PAGE_SIZE = 30;

function ImageCardSkeleton() {
    return (
        <div className="flex h-full flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <Skeleton className="mt-1 h-4 w-2/3" />
            </div>
            <div className="min-h-8 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="mt-auto flex items-center gap-3">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-12" />
            </div>
        </div>
    );
}

interface DockerHubSearchDialogProps {
    trigger: ReactNode;
    onSelect: (image: DockerHubImage) => void;
    isSelected?: (image: DockerHubImage) => boolean;
}

export function DockerHubSearchDialog({
    trigger,
    onSelect,
    isSelected,
}: DockerHubSearchDialogProps) {
    const t = useTranslations('docker.pullImagePage');

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sort, setSort] = useState<DockerHubSort>('pull_count');
    const [source, setSource] = useState<SourceFilter>('official');

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(id);
    }, [search]);

    const getKey = useCallback(
        (pageIndex: number, previousPageData: DockerHubImage[] | null) => {
            if (!open) return null;
            if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
            const from = pageIndex * PAGE_SIZE;
            return {
                url: `/api/docker/images/search?query=${encodeURIComponent(debouncedSearch)}&sort=${sort}&from=${from}`,
            };
        },
        [open, debouncedSearch, sort],
    );

    const {
        data: pages,
        setSize,
        isLoading,
        isValidating,
    } = useSWRInfinite<DockerHubImage[]>(getKey, fetcherApi, {
        keepPreviousData: true,
        revalidateFirstPage: false,
        revalidateOnMount: true,
    });

    useEffect(() => {
        setSize(1);
        scrollRef.current?.scrollTo({ top: 0 });
    }, [open, debouncedSearch, sort, setSize]);

    const images = useMemo(() => pages?.flat() ?? [], [pages]);

    const filteredImages = useMemo(() => {
        if (source === 'official') return images.filter((image) => image.isOfficial);
        return images;
    }, [images, source]);

    const lastPage = pages?.[pages.length - 1];
    const isReachingEnd = !!lastPage && lastPage.length < PAGE_SIZE;
    const isLoadingMore = isValidating && (pages?.length ?? 0) > 0;

    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<() => void>(() => {});
    loadMoreRef.current = () => {
        if (isValidating || isReachingEnd) return;
        setSize((s) => s + 1);
    };

    useEffect(() => {
        if (!open) return;
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const root = sentinel.closest<HTMLElement>('[data-slot="scroll-area-viewport"]');

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMoreRef.current();
            },
            { root, rootMargin: '300px' },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [open, pages?.length]);

    const handleSelect = (image: DockerHubImage) => {
        onSelect(image);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="flex flex-col gap-4 overflow-hidden sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{t('browseImagesTitle')}</DialogTitle>
                    <DialogDescription>{t('browseImagesDescription')}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 px-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('searchImagesPlaceholder')}
                            className="pl-9"
                        />
                    </div>
                    <Select value={sort} onValueChange={(value) => setSort(value as DockerHubSort)}>
                        <SelectTrigger className="sm:w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('sortLabel')}</SelectLabel>
                                <SelectItem value="pull_count">{t('sortPulls')}</SelectItem>
                                <SelectItem value="relevance">{t('sortRelevance')}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select
                        value={source}
                        onValueChange={(value) => setSource(value as SourceFilter)}
                    >
                        <SelectTrigger className="sm:w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{t('sourceLabel')}</SelectLabel>
                                <SelectItem value="all">{t('sourceAll')}</SelectItem>
                                <SelectItem value="official">{t('sourceOfficial')}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <ScrollAreaWithShadow
                    ref={scrollRef}
                    bottomShadow
                    className="h-[70vh] overflow-hidden px-3"
                >
                    {isLoading && (
                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                            <Spinner className="size-4" />
                            {t('searchingImages')}
                        </div>
                    )}

                    {!isLoading && filteredImages.length === 0 && (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10 text-sm">
                            <Search className="size-6 opacity-50" />
                            {debouncedSearch
                                ? t('searchImagesNoResults', { query: debouncedSearch })
                                : t('searchImagesEmpty')}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 pb-3 sm:grid-cols-3">
                        {filteredImages.map((image) => (
                            <button
                                key={image.slug}
                                type="button"
                                onClick={() => handleSelect(image)}
                                className={cn(
                                    'hover:border-primary hover:bg-accent/30 flex h-full cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-all',
                                    isSelected?.(image) && 'border-primary/70 bg-accent/50',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <ImageLogo image={image} />
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <span className="truncate text-sm font-semibold">
                                            {image.name}
                                        </span>
                                        {image.isOfficial && (
                                            <BadgeCheck className="text-primary size-4 shrink-0" />
                                        )}
                                    </div>
                                </div>
                                <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs">
                                    {image.description}
                                </p>
                                <div className="text-muted-foreground mt-auto flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1">
                                        <Star className="size-3" />
                                        {image.starCount.toLocaleString()}
                                    </span>
                                    {image.pullCount && (
                                        <span className="flex items-center gap-1">
                                            <Download className="size-3" />
                                            {image.pullCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                        {isLoadingMore &&
                            !isLoading &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <ImageCardSkeleton key={`skeleton-${i}`} />
                            ))}
                    </div>

                    <div ref={sentinelRef} aria-hidden className="h-px w-full" />
                </ScrollAreaWithShadow>
            </DialogContent>
        </Dialog>
    );
}
