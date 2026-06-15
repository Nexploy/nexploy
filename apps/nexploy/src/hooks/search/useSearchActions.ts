'use client';

import { useCallback } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';

export interface SearchHandlers {
    handleStartBuild: (repositoryId: string) => void;
}

export function useSearchActions(): SearchHandlers {
    const tBuild = useTranslations('repository.builds');

    const { execute: triggerBuild } = useAction(onStartBuild, {
        onSuccess: ({ data }) => {
            toast.success(tBuild('startSuccess', { number: data?.numberBuild }));
        },
    });

    const handleStartBuild = useCallback(
        (repositoryId: string) => triggerBuild({ repositoryId }),
        [triggerBuild],
    );

    return { handleStartBuild };
}
