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
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    repositoryId: string;
    showText?: boolean;
    mode?: 'all' | 'onlyDeploy';
}

export function RunBuildButton({
    repositoryId,
    showText = true,
    mode = 'all',
    ...props
}: DeployButtonProps) {
    const { selectedEnvironmentId } = useEnvironmentStore();
    const { execute, isPending } = useAction(onStartBuild, {
        onSuccess: () => {
            toast.success('Build started successfully');
        },
    });

    const { openDialog } = useConfirmationDialogStore();

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>, commitHash?: string) => {
        e.preventDefault();
        execute({ repositoryId, commitHash, environmentId: selectedEnvironmentId! });
    };

    const handleOpenBuildOptions = () => {
        openDialog({
            title: 'Options de build',
            description: 'Configurez les paramètres de build',
            content: (
                <BuildOptionsDialog
                    onSubmit={(data) => {
                        execute({
                            repositoryId,
                            commitHash: data.commitHash || undefined,
                            environmentId: selectedEnvironmentId!,
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
                {showText && (isPending ? 'Building...' : 'Run build')}
            </Button>
            {mode === 'all' && (
                <Button
                    {...props}
                    onClick={handleOpenBuildOptions}
                    className="px-2"
                    disabled={isPending}
                    size={'icon'}
                    aria-label="Build options"
                >
                    <Settings className="size-4" />
                </Button>
            )}
        </ButtonGroup>
    );
}
