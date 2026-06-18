'use client';

import { useAction } from 'next-safe-action/hooks';
import { useQueryState } from 'nuqs';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { useTranslations } from 'next-intl';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';
import { usePermissions } from '@/contexts/PermissionContext';
import { useStages } from '@/hooks/useStages';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    repositoryId: string;
    showText?: boolean;
}

export function RunBuildButton({ repositoryId, showText = true, ...props }: DeployButtonProps) {
    const { can } = usePermissions();

    const t = useTranslations('repository.builds');
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);
    const triggerBuildRefresh = usePipelineEditorStore((s) => s.triggerBuildRefresh);

    const { stages } = useStages(repositoryId);
    const [stageParam] = useQueryState('stage');

    const { execute, isPending } = useAction(onStartBuild, {
        onSuccess: ({ data }) => {
            toast.success(t('startSuccess', { number: data?.numberBuild }));
            if (data) setActiveBuildId(data.id);
            triggerBuildRefresh();
        },
    });

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const fallback = stages.find((s) => s.isProduction) ?? stages[0];
        const stageId =
            stageParam && stages.some((s) => s.id === stageParam) ? stageParam : fallback?.id;
        execute({ repositoryId, stageId });
    };

    if (!can('repository', 'deploy')) return null;

    return (
        <Button {...props} onClick={(e) => handleDeploy(e)} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {showText && (isPending ? t('building') : t('runBuild'))}
        </Button>
    );
}
