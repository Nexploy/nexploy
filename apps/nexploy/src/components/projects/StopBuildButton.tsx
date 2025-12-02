'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Square } from 'lucide-react';
import { onCancelBuild } from '@/actions/project/cancelBuild.action';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface StopBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    showText?: boolean;
}

export function StopBuildButton({ buildId, showText = true, ...props }: StopBuildButtonProps) {
    const router = useRouter();

    const { execute, isPending } = useAction(onCancelBuild, {
        onSuccess: () => {
            toast.success('Build cancelled');
            router.refresh();
        },
        onError: () => {
            toast.error('Failed to cancel build');
        },
    });

    const handleStop = () => {
        execute({ buildId });
    };

    return (
        <Button variant="destructive" {...props} onClick={handleStop} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Square />}
            {showText && (isPending ? 'Stopping...' : 'Stop')}
        </Button>
    );
}
