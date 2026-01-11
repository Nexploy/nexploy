'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket, Settings } from 'lucide-react';
import { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { BuildOptionsDialog } from './BuildOptionsDialog';
import { ButtonGroup } from '@workspace/ui/components/button-group';
import { useTranslations } from 'next-intl';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    repositoryId: string;
    environmentId: string;
    showText?: boolean;
    mode?: 'all' | 'onlyDeploy';
}

export function RunBuildButton({
    repositoryId,
    environmentId,
    showText = true,
    mode = 'all',
    ...props
}: DeployButtonProps) {
    const t = useTranslations('repository.builds');

    const { execute, isPending } = useAction(onStartBuild, {
        onSuccess: () => {
            toast.success(t('startSuccess'));
        },
    });

    const { openDialog } = useConfirmationDialogStore();

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>, commitHash?: string) => {
        e.preventDefault();
        execute({ repositoryId, commitHash });
    };

    const handleOpenBuildOptions = () => {
        openDialog({
            title: t('buildOptions'),
            description: t('buildOptionsDescription'),
            content: (
                <BuildOptionsDialog
                    onSubmit={({ commitHash }) => {
                        execute({
                            repositoryId,
                            commitHash,
                        });
                    }}
                />
            ),
        });
    };

    return (
        <ButtonGroup className="flex items-center gap-0.5">
            <Button {...props} onClick={(e) => handleDeploy(e)} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
                {showText && (isPending ? t('building') : t('runBuild'))}
            </Button>
            {mode === 'all' && (
                <Button
                    {...props}
                    onClick={handleOpenBuildOptions}
                    className="px-2"
                    disabled={isPending}
                    size={'icon'}
                    aria-label={t('buildOptions')}
                >
                    <Settings className="size-4" />
                </Button>
            )}
        </ButtonGroup>
    );
}
