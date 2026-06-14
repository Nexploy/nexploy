'use client';

import { CommandGroup, CommandItem, CommandSeparator } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { ImageRow } from '../SearchResultRows';
import type { TypeLabels } from '../SearchPrimitives';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';

interface ImageResultsGroupProps {
    images: Image[];
    typeLabel: TypeLabels['image'];
}

export function ImageResultsGroup({ images, typeLabel }: ImageResultsGroupProps) {
    const router = useRouter();
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const getItemProps = useSearchItemSelect();

    if (images.length === 0) return null;

    return (
        <>
            <CommandSeparator />
            <CommandGroup heading={tNav('images')}>
                {images.map((img) => (
                    <CommandItem
                        key={img.id}
                        {...getItemProps(`image:${img.id}`, () =>
                            runCommand(() => router.push(`/docker/images/${img.id}`)),
                        )}
                    >
                        <ImageRow image={img} typeLabel={typeLabel} />
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );
}
