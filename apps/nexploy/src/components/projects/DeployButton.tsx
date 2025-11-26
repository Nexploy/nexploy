'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Rocket } from 'lucide-react';
import { onDeployAction } from '@/actions/project/deploy.action';
import { useRouter } from 'next/navigation';

interface DeployButtonProps {
    projectId: string;
}

export function DeployButton({ projectId }: DeployButtonProps) {
    const router = useRouter();

    const { execute, isPending } = useAction(onDeployAction, {
        onSuccess: () => {
            router.refresh();
        },
    });

    const handleDeploy = () => {
        execute({ projectId });
    };

    return (
        <Button onClick={handleDeploy} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            {isPending ? 'Deploying...' : 'Deploy Now'}
        </Button>
    );
}
