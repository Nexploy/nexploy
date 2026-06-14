'use client';

import { useCallback, useEffect } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { useSearchStore } from '@/stores/useSearchStore';

export interface SearchHandlers {
    handleAskAI: (query: string) => void;
    handleStartBuild: (repositoryId: string) => void;
}

export function useSearchEffects(): SearchHandlers {
    const open = useSearchStore((s) => s.open);
    const reposFetched = useSearchStore((s) => s.reposFetched);
    const setRepositories = useSearchStore((s) => s.setRepositories);
    const setReposFetched = useSearchStore((s) => s.setReposFetched);

    const tBuild = useTranslations('repository.builds');
    const openPanel = useAIPanelStore((s) => s.openPanel);

    useEffect(() => {
        if (!open || reposFetched) return;
        fetch('/api/repositories')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setRepositories(data);
                setReposFetched(true);
            })
            .catch(() => setReposFetched(true));
    }, [open, reposFetched, setRepositories, setReposFetched]);

    useEffect(() => {
        if (!open) setReposFetched(false);
    }, [open, setReposFetched]);

    const { execute: triggerBuild } = useAction(onStartBuild, {
        onSuccess: ({ data }) => {
            toast.success(tBuild('startSuccess', { number: data?.numberBuild }));
        },
    });

    const handleStartBuild = useCallback(
        (repositoryId: string) => triggerBuild({ repositoryId }),
        [triggerBuild],
    );

    const handleAskAI = useCallback(
        (query: string) => {
            useSearchStore.getState().closeDialog();
            openPanel(query);
        },
        [openPanel],
    );

    return { handleStartBuild, handleAskAI };
}
