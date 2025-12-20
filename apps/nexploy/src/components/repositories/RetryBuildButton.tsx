'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { RotateCcw } from 'lucide-react';
import { onRetryBuild } from '@/actions/repository/builds/retryBuild.action';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';

interface RetryBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    showText?: boolean;
    mode?: 'button' | 'dropdown';
    onSuccess?: () => void;
}

export function RetryBuildButton({
    buildId,
    mode = 'button',
    showText = true,
    onSuccess,
    ...props
}: RetryBuildButtonProps) {
    const router = useRouter();
    const { selectedEnvironmentId } = useEnvironmentStore();

    const { execute, isPending } = useAction(onRetryBuild, {
        onSuccess: () => {
            toast.success('Build restarted successfully');
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        },
    });

    const handleRetry = () => {
        execute({ buildId, environmentId: selectedEnvironmentId! });
    };

    if (mode === 'dropdown') {
        return (
            <DropdownMenuItem
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRetry();
                }}
            >
                <RotateCcw />
                Retry
            </DropdownMenuItem>
        );
    }

    return (
        <Button
            {...props}
            icon={RotateCcw}
            isLoading={isPending}
            onClick={handleRetry}
            disabled={isPending}
        >
            {showText && (isPending ? 'Retrying...' : 'Retry')}
        </Button>
    );
}
