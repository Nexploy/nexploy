'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { useTranslations } from 'next-intl';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    repositoryId: string;
    showText?: boolean;
}

export function RunBuildButton({ repositoryId, showText = true, ...props }: DeployButtonProps) {
    const t = useTranslations('repository.builds');
    const setActiveBuildId = usePipelineEditorStore((s) => s.setActiveBuildId);

    const { execute, isPending } = useAction(onStartBuild, {
        onSuccess: ({ data }) => {
            toast.success(t('startSuccess'));
            if (data) setActiveBuildId(data.buildId);
        },
    });

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>, commitHash?: string) => {
        e.preventDefault();
        execute({ repositoryId, commitHash });
    };

    return (
        <Button {...props} onClick={(e) => handleDeploy(e)} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {showText && (isPending ? t('building') : t('runBuild'))}
        </Button>
    );
}
