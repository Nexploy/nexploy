'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useHotkeys } from '@/lib/useHotKeys';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useSearchStore } from '@/stores/useSearchStore';
import { useSearchItemSelect } from '@/hooks/search/useSearchItemSelect';
import { filterRepositories } from '@/hooks/search/searchFilters';
import type { RepositoryResult } from '@workspace/typescript-interface/repository/search';
import { useSearchActions } from '@/hooks/search/useSearchActions.ts';
import { FolderGit2 } from 'lucide-react';

export function RepositorySearchGroup() {
    const t = useTranslations('ai.command');
    const tNav = useTranslations('navigation');

    const router = useRouter();

    const open = useSearchStore((s) => s.open);
    const commandValue = useSearchStore((s) => s.commandValue);
    const inputValue = useSearchStore((s) => s.inputValue);

    const runCommand = useSearchStore((s) => s.runCommand);

    const getItemProps = useSearchItemSelect();
    const { handleStartBuild } = useSearchActions();

    useHotkeys(
        ['meta+enter'],
        useCallback(
            (e: KeyboardEvent) => {
                if (open && commandValue.startsWith('repo:')) {
                    e.stopPropagation();
                    handleStartBuild(commandValue.slice(5));
                }
            },
            [open, commandValue, handleStartBuild],
        ),
        { preventDefault: true, capture: true },
    );

    const { data } = useSWR<RepositoryResult[]>(
        open ? { url: '/api/repositories' } : null,
        fetcherApi,
    );

    const repos = filterRepositories(data ?? [], inputValue);

    if (repos.length === 0) return null;

    return (
        <CommandGroup heading={tNav('repositories')}>
            {repos.map((repo) => (
                <CommandItem
                    key={repo.id}
                    {...getItemProps(`repo:${repo.id}`, () =>
                        runCommand(() => router.push(`/repositories/${repo.id}`)),
                    )}
                >
                    <FolderGit2 className="text-muted-foreground h-4 w-4 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">{repo.name}</span>
                        <span className="text-muted-foreground truncate text-xs">
                            {repo.repositoryUrl.replace(/^https?:\/\//, '')}
                        </span>
                    </div>
                    <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                        {t('types.repository')}
                    </span>
                </CommandItem>
            ))}
        </CommandGroup>
    );
}
