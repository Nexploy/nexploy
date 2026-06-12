'use client';

import { useMemo } from 'react';
import { CommandGroup, CommandItem, CommandSeparator } from '@workspace/ui/components/command';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from './useSearchStore';
import { useDockerSearch } from './useDockerSearch';
import { ContainerRow, ImageRow, NetworkRow, RepositoryRow, VolumeRow } from './SearchResultRows';
import type { TypeLabels } from './SearchPrimitives';

interface SearchResultsListProps {
    typeLabels: TypeLabels;
    onAskAI: (query: string) => void;
}

export function SearchResultsList({ typeLabels, onAskAI }: SearchResultsListProps) {
    const router = useRouter();
    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');

    const inputValue = useSearchStore((s) => s.inputValue);
    const repositories = useSearchStore((s) => s.repositories);
    const runCommand = useSearchStore((s) => s.runCommand);

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
            <CommandGroup heading={t('aiAssistant')}>
                <CommandItem value={`ask-ai:${inputValue}`} onSelect={() => onAskAI(inputValue)}>
                    <Sparkles className="text-muted-foreground mr-3 h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{t('askAi', { query: inputValue })}</span>
                </CommandItem>
            </CommandGroup>

            {filteredRepos.length > 0 && (
                <>
                    <CommandSeparator />
                    <CommandGroup heading={tNav('repositories')}>
                        {filteredRepos.map((repo) => (
                            <CommandItem
                                key={repo.id}
                                value={`repo:${repo.id}`}
                                onSelect={() =>
                                    runCommand(() => router.push(`/repositories/${repo.id}`))
                                }
                            >
                                <RepositoryRow repo={repo} typeLabel={typeLabels.repository} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {containers.length > 0 && (
                <>
                    <CommandSeparator />
                    <CommandGroup heading={tNav('containers')}>
                        {containers.map((c) => (
                            <CommandItem
                                key={c.id}
                                value={`container:${c.id}`}
                                onSelect={() =>
                                    runCommand(() => router.push(`/docker/containers/${c.id}`))
                                }
                            >
                                <ContainerRow container={c} typeLabel={typeLabels.container} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {images.length > 0 && (
                <>
                    <CommandSeparator />
                    <CommandGroup heading={tNav('images')}>
                        {images.map((img) => (
                            <CommandItem
                                key={img.id}
                                value={`image:${img.id}`}
                                onSelect={() =>
                                    runCommand(() => router.push(`/docker/images/${img.id}`))
                                }
                            >
                                <ImageRow image={img} typeLabel={typeLabels.image} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {volumes.length > 0 && (
                <>
                    <CommandSeparator />
                    <CommandGroup heading={tNav('volumes')}>
                        {volumes.map((vol) => (
                            <CommandItem
                                key={vol.name}
                                value={`volume:${vol.name}`}
                                onSelect={() =>
                                    runCommand(() =>
                                        router.push(
                                            `/docker/volumes/${encodeURIComponent(vol.name)}`,
                                        ),
                                    )
                                }
                            >
                                <VolumeRow volume={vol} typeLabel={typeLabels.volume} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {networks.length > 0 && (
                <>
                    <CommandSeparator />
                    <CommandGroup heading={tNav('networks')}>
                        {networks.map((net) => (
                            <CommandItem
                                key={net.id}
                                value={`network:${net.id}`}
                                onSelect={() =>
                                    runCommand(() => router.push(`/docker/networks/${net.id}`))
                                }
                            >
                                <NetworkRow network={net} typeLabel={typeLabels.network} />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {!hasAnyResults && (
                <p className="text-muted-foreground py-10 text-center text-sm">
                    {t('noResults', { query: inputValue })}
                </p>
            )}
        </>
    );
}
