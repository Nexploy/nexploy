import { ReactNode } from 'react';
import { LucideIcon, Square } from 'lucide-react';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { ResumeBuildButton } from '@/components/repositories/ResumeBuildButton';
import { RemoveBuildButton } from '@/components/repositories/RemoveBuildButton';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { RetryBuildButton } from '@/components/repositories/RetryBuildButton';
import { useTranslations } from 'next-intl';

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
    status: BuildStatus;
    lastCompletedStep?: string | null;
    mode?: 'button' | 'dropdown';
    onResumeSuccess?: () => void;
    onRetrySuccess?: () => void;
    onRemoveSuccess?: () => void;
}

export function useBuildActions({
    buildId,
    status,
    lastCompletedStep,
    mode = 'button',
    onResumeSuccess,
    onRetrySuccess,
    onRemoveSuccess,
}: UseBuildActionsProps): BuildAction[] {
    const t = useTranslations('repository.builds');
    const isBuilding = status === 'QUEUED' || status === 'BUILDING';
    const canResume = status === 'FAILED';
    const canRetry = status === 'CANCELLED';
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

    if (canResume) {
        actions.push({
            type: 'component',
            id: 'resume',
            component: (
                <ResumeBuildButton
                    mode={mode}
                    buildId={buildId}
                    lastCompletedStep={lastCompletedStep}
                    onSuccess={onResumeSuccess}
                />
            ),
        });
    }

    if (canRetry) {
        actions.push({
            type: 'component',
            id: 'retry',
            component: (
                <RetryBuildButton mode={mode} buildId={buildId} onSuccess={onRetrySuccess} />
            ),
        });
    }

    if (canRemove) {
        actions.push({
            type: 'component',
            id: 'remove',
            separator: canResume || canRetry,
            component: (
                <RemoveBuildButton mode={mode} buildId={buildId} onSuccess={onRemoveSuccess} />
            ),
        });
    }

    return actions;
}
