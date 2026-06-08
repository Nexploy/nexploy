'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { useTranslations } from 'next-intl';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { usePermissions } from '@/contexts/PermissionContext';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    repositoryId: string;
    showText?: boolean;
}

export function RunBuildButton({ repositoryId, showText = true, ...props }: DeployButtonProps) {
    const { can } = usePermissions();
    if (!can('repository', 'deploy')) return null;
    const t = useTranslations('repository.builds');
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);
    const triggerBuildRefresh = usePipelineEditorStore((s) => s.triggerBuildRefresh);

    const { execute, isPending } = useAction(onStartBuild, {
        onSuccess: ({ data }) => {
            toast.success(t('startSuccess', { number: data?.numberBuild }));
            if (data) setActiveBuildId(data.id);
            triggerBuildRefresh();
        },
    });

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        execute({ repositoryId });
    };

    return (
        <Button {...props} onClick={(e) => handleDeploy(e)} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {showText && (isPending ? t('building') : t('runBuild'))}
        </Button>
    );
}
