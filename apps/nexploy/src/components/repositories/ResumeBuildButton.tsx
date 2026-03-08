'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Loader2, Play } from 'lucide-react';
import { onResumeBuild } from '@/actions/repository/builds/resumeBuild.action';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

interface ResumeBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    lastCompletedStep?: string | null;
    onSuccess?: () => void;
}

export function ResumeBuildButton({
    buildId,
    lastCompletedStep: _lastCompletedStep,
    onSuccess,
    ...props
}: ResumeBuildButtonProps) {
    const router = useRouter();
    const { selectedEnvironmentId } = useEnvironmentStore();
    const t = useTranslations('repository.builds');

    const { execute, isPending } = useAction(onResumeBuild, {
        onSuccess: () => {
            toast.success(t('resumeSuccess'));
            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        },
    });

    return (
        <Button
            {...props}
            onClick={() => execute({ buildId, environmentId: selectedEnvironmentId! })}
            disabled={isPending}
        >
            {isPending ? <Loader2 className="animate-spin" /> : <Play className="size-4" />}
            {isPending ? t('resuming') : t('resume')}
        </Button>
    );
}
