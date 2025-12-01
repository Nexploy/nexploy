'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { onStartBuildProject } from '@/actions/project/startBuildProject.action';
import { ComponentProps, MouseEvent } from 'react';
import { toast } from 'sonner';

interface DeployButtonProps extends ComponentProps<typeof Button> {
    projectId: string;
    showText?: boolean;
}

export function RunBuildButton({ projectId, showText = true, ...props }: DeployButtonProps) {
    const { execute, isPending } = useAction(onStartBuildProject, {
        onSuccess: () => {
            toast.success('Build started successfully');
        },
    });

    const handleDeploy = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        execute({ projectId });
    };

    return (
        <Button {...props} onClick={handleDeploy} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {showText && (isPending ? 'Building...' : 'Run build')}
        </Button>
    );
}
