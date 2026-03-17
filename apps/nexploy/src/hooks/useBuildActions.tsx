import { ReactNode } from 'react';
import { LucideIcon, Square } from 'lucide-react';
import { onCancelBuild } from '@/actions/repository/builds/cancelBuild.action';
import { RemoveBuildButton } from '@/components/repositories/RemoveBuildButton';
import { useTranslations } from 'next-intl';
import { BuildStatus } from 'generated/client';

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
    mode?: 'button' | 'dropdown';
    onRemoveSuccess?: () => void;
}

export function useBuildActions({
    buildId,
    status,
    mode = 'button',
    onRemoveSuccess,
}: UseBuildActionsProps): BuildAction[] {
    const t = useTranslations('repository.builds');
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

    return actions;
}
