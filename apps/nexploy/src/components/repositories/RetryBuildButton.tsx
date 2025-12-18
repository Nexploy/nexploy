'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { onRetryBuild } from '@/actions/repository/builds/retryBuild.action';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';

interface RetryBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    showText?: boolean;
}

export function RetryBuildButton({ buildId, showText = true, ...props }: RetryBuildButtonProps) {
    const router = useRouter();
    const { selectedEnvironmentId } = useEnvironmentStore();

    const { execute, isPending } = useAction(onRetryBuild, {
        onSuccess: () => {
            toast.success('Build restarted successfully');
            router.refresh();
        },
    });

    const handleRetry = async () => {
        execute({ buildId, environmentId: selectedEnvironmentId! });
    };

    return (
        <Button {...props} onClick={handleRetry} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            {showText && (isPending ? 'Retrying...' : 'Retry')}
        </Button>
    );
}
