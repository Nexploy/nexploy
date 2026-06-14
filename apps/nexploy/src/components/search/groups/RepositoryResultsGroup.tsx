'use client';

import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { RepositoryRow } from '../SearchResultRows';
import type { RepositoryResult, TypeLabels } from '../SearchPrimitives';

interface RepositoryResultsGroupProps {
    repos: RepositoryResult[];
    typeLabel: TypeLabels['repository'];
}

export function RepositoryResultsGroup({ repos, typeLabel }: RepositoryResultsGroupProps) {
    const router = useRouter();
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const getItemProps = useSearchItemSelect();

    if (repos.length === 0) return null;

    return (
        <>
            <CommandGroup heading={tNav('repositories')}>
                {repos.map((repo) => (
                    <CommandItem
                        key={repo.id}
                        {...getItemProps(`repo:${repo.id}`, () =>
                            runCommand(() => router.push(`/repositories/${repo.id}`)),
                        )}
                    >
                        <RepositoryRow repo={repo} typeLabel={typeLabel} />
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    );
}
