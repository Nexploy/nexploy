'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';
import { onStartBuild } from '@/actions/repository/builds/startBuild.action';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    repositoryId: string;
    showText?: boolean;
}

export function RunBuildButton({ repositoryId, showText = true, ...props }: DeployButtonProps) {
    const { execute, isPending } = useAction(onStartBuild, {
        onSuccess: () => {
            toast.success('Build started successfully');
        },
    });

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        execute({ repositoryId });
    };

    return (
        <Button {...props} onClick={handleDeploy} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {showText && (isPending ? 'Building...' : 'Run build')}
        </Button>
    );
}
