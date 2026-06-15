'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useImagesStore } from '@/stores/docker/useImagesStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { filterImages } from '@/hooks/search/searchFilters';
import { LayoutList } from 'lucide-react';
import { formatBytes } from '@/utils/formatBytes.ts';

export function ImageResultsSearchGroup() {
    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');

    const router = useRouter();

    const runCommand = useSearchStore((s) => s.runCommand);
    const inputValue = useSearchStore((s) => s.inputValue);

    const allImages = useImagesStore((s) => s.images);

    const getItemProps = useSearchItemSelect();

    const images = filterImages(allImages, inputValue);

    if (images.length === 0) return null;

    return (
        <CommandGroup heading={tNav('images')}>
            {images.map((image) => {
                const validTags = image.repoTags?.filter((t) => t !== '<none>:<none>') ?? [];
                const displayName = validTags[0] ?? image.id.slice(0, 12);
                const extra = validTags.length > 1 ? `+${validTags.length - 1} tags` : null;

                return (
                    <CommandItem
                        key={image.id}
                        {...getItemProps(`image:${image.id}`, () =>
                            runCommand(() => router.push(`/docker/images/${image.id}`)),
                        )}
                    >
                        <LayoutList className="text-muted-foreground h-4 w-4 shrink-0" />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-sm font-medium">{displayName}</span>
                            {extra && (
                                <span className="text-muted-foreground truncate text-xs">
                                    {extra}
                                </span>
                            )}
                        </div>
                        <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                            {formatBytes(image.size)}
                        </span>
                        <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                            {t('types.image')}
                        </span>
                    </CommandItem>
                );
            })}
        </CommandGroup>
    );
}
