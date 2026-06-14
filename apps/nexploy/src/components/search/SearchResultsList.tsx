'use client';

import { useMemo } from 'react';
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
}

export function SearchResultsList({ typeLabels }: SearchResultsListProps) {
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
            {!hasAnyResults && <AskAiGroup />}
            <RepositoryResultsGroup repos={filteredRepos} typeLabel={typeLabels.repository} />
            <ContainerResultsGroup containers={containers} typeLabel={typeLabels.container} />
            <ImageResultsGroup images={images} typeLabel={typeLabels.image} />
            <VolumeResultsGroup volumes={volumes} typeLabel={typeLabels.volume} />
            <NetworkResultsGroup networks={networks} typeLabel={typeLabels.network} />
        </>
    );
}
