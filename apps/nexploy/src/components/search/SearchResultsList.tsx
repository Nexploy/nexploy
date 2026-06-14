'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { AskAiGroup } from './groups/AskAiGroup';
import { RepositoryResultsGroup } from './groups/RepositoryResultsGroup';
import { ContainerResultsGroup } from './groups/ContainerResultsGroup';
import { ImageResultsGroup } from './groups/ImageResultsGroup';
import { VolumeResultsGroup } from './groups/VolumeResultsGroup';
import { NetworkResultsGroup } from './groups/NetworkResultsGroup';
import type { TypeLabels } from './SearchPrimitives';
import { useDockerSearch } from '@/hooks/search/useDockerSearch.ts';

interface SearchResultsListProps {
    typeLabels: TypeLabels;
    onAskAI: (query: string) => void;
}

export function SearchResultsList({ typeLabels, onAskAI }: SearchResultsListProps) {
    const t = useTranslations('ai.command');

    const inputValue = useSearchStore((s) => s.inputValue);
    const repositories = useSearchStore((s) => s.repositories);

    const { containers, images, volumes, networks, hasResults } = useDockerSearch(inputValue);

    const filteredRepos = useMemo(() => {
        const q = inputValue.toLowerCase();
        return repositories
            .filter(
                (r) =>
                    r.name.toLowerCase().includes(q) || r.repositoryUrl.toLowerCase().includes(q),
            )
            .slice(0, 5);
    }, [inputValue, repositories]);

    const hasAnyResults = hasResults || filteredRepos.length > 0;

    return (
        <>
            <AskAiGroup onAskAI={onAskAI} />
            <RepositoryResultsGroup repos={filteredRepos} typeLabel={typeLabels.repository} />
            <ContainerResultsGroup containers={containers} typeLabel={typeLabels.container} />
            <ImageResultsGroup images={images} typeLabel={typeLabels.image} />
            <VolumeResultsGroup volumes={volumes} typeLabel={typeLabels.volume} />
            <NetworkResultsGroup networks={networks} typeLabel={typeLabels.network} />
            {!hasAnyResults && (
                <p className="text-muted-foreground py-10 text-center text-sm">
                    {t('noResults', { query: inputValue })}
                </p>
            )}
        </>
    );
}
