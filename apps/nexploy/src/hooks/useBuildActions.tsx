import { ReactNode } from 'react';
import { LucideIcon, RotateCcw, Square, Trash2 } from 'lucide-react';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { onRetryBuild } from '@/actions/repository/builds/retryBuild.action';
import { onRemoveBuild } from '@/actions/repository/builds/removeBuild.action';
import { ResumeBuildButton } from '@/components/repositories/ResumeBuildButton';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';

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
}

export function useBuildActions({
    buildId,
    status,
    lastCompletedStep,
    mode = 'button',
}: UseBuildActionsProps): BuildAction[] {
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
            label: 'Stop',
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
                />
            ),
        });
    }

    if (canRetry) {
        actions.push({
            type: 'button',
            id: 'retry',
            icon: RotateCcw,
            label: 'Retry',
            onClick: () => onRetryBuild({ buildId }),
        });
    }

    if (canRemove) {
        actions.push({
            type: 'button',
            id: 'remove',
            icon: Trash2,
            label: mode === 'dropdown' ? 'Remove' : '',
            onClick: () => onRemoveBuild({ buildId }),
            variant: 'destructive',
            separator: canResume || canRetry,
        });
    }

    return actions;
}
