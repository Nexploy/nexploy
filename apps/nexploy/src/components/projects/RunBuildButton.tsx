'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { onStartBuildProject } from '@/actions/project/startBuildProject.action';

interface DeployButtonProps {
    projectId: string;
}

export function RunBuildButton({ projectId }: DeployButtonProps) {
    const { execute, isPending } = useAction(onStartBuildProject);

    const handleDeploy = () => {
        execute({ projectId });
    };

    return (
        <Button onClick={handleDeploy} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {isPending ? 'Building...' : 'Run build'}
        </Button>
    );
}
