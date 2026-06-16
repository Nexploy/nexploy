'use client';

import { ReactNode, useCallback } from 'react';
import { LucideIcon, Square } from 'lucide-react';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { RemoveBuildButton } from '@/components/repositories/RemoveBuildButton';
import { useTranslations } from 'next-intl';
import { BuildStatus } from 'generated/client';
import { useRealtime } from 'inngest/react';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { isBuildLive } from '@/utils/buildStatus';
import type { BuildMessage } from '@workspace/typescript-interface/repository/buildRealtime';

interface BaseBuildAction {
    id: string;
    separator?: boolean;
}

export interface BuildActionButton extends BaseBuildAction {
    type: 'button';
    icon: LucideIcon;
    label?: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
}

export interface BuildActionComponent extends BaseBuildAction {
    type: 'component';
    component: ReactNode;
}

export type BuildAction = BuildActionButton | BuildActionComponent;

interface UseBuildActionsProps {
    buildId: string;
    initialStatus: BuildStatus;
    mode?: 'button' | 'dropdown';
    onRemoveSuccess?: () => void;
}

export function useBuildActions({
    buildId,
    initialStatus,
    mode = 'button',
    onRemoveSuccess,
}: UseBuildActionsProps): { actions: BuildAction[]; status: BuildStatus } {
    const t = useTranslations('repository.builds');

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildIdAction({
            buildId,
            topics: ['build-status'],
        });
        if (!result?.data) throw new Error('Failed to get subscription token');
        return result.data;
    }, [buildId]);

    const { messages } = useRealtime({
        enabled: isBuildLive(initialStatus),
        token: refreshToken,
    });
    const data = messages.all as BuildMessage[];

    const liveStatus = data.findLast((e) => e.topic === 'build-status')?.data as
        | { buildStatus: BuildStatus }
        | undefined;

    const status = liveStatus?.buildStatus ?? initialStatus;
    const isBuilding = status === 'QUEUED' || status === 'BUILDING';
    const canRemove = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

    const actions: BuildAction[] = [];

    if (isBuilding) {
        actions.push({
            type: 'button',
            id: 'stop',
            icon: Square,
            label: t('stop'),
            onClick: () => onCancelBuild({ buildId }),
            variant: 'destructive',
        });
    }

    if (canRemove) {
        actions.push({
            type: 'component',
            id: 'remove',
            component: (
                <RemoveBuildButton mode={mode} buildId={buildId} onSuccess={onRemoveSuccess} />
            ),
        });
    }

    return { actions, status };
}
