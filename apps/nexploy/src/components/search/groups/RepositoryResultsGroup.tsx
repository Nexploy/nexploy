'use client';

import { useCallback } from 'react';
import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useHotkeys } from '@/lib/useHotKeys';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { RepositoryRow } from '../SearchResultRows';
import type { RepositoryResult, TypeLabels } from '../SearchPrimitives';
import { useSearchEffects } from '@/hooks/search/useSearchEffects.ts';

interface RepositoryResultsGroupProps {
    repos: RepositoryResult[];
    typeLabel: TypeLabels['repository'];
}

export function RepositoryResultsGroup({ repos, typeLabel }: RepositoryResultsGroupProps) {
    const router = useRouter();
    const tNav = useTranslations('navigation');
    const runCommand = useSearchStore((s) => s.runCommand);
    const getItemProps = useSearchItemSelect();

    const { handleStartBuild } = useSearchEffects();

    const open = useSearchStore((s) => s.open);
    const commandValue = useSearchStore((s) => s.commandValue);

    useHotkeys(
        ['meta+enter'],
        useCallback(() => {
            if (open && commandValue.startsWith('repo:')) {
                handleStartBuild(commandValue.slice(5));
            }
        }, [open, commandValue]),
        { preventDefault: true },
    );

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
