'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ChevronDown, Loader2, Play } from 'lucide-react';
import { onResumeBuild } from '@/actions/repository/builds/resumeBuild.action';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BUILD_STEPS_ORDER, BuildStep } from '@workspace/typescript-interface/inngest/build';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';
import { useTranslations } from 'next-intl';

interface ResumeBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    mode?: 'button' | 'dropdown';
    lastCompletedStep?: string | null;
    onSuccess?: () => void;
}

const STEP_KEYS: Record<BuildStep, string> = {
    'clone-repository': 'cloneRepository',
    'prepare-dockerfile': 'prepareDockerfile',
    'prepare-compose': 'prepareCompose',
    'write-env-file': 'writeEnvFile',
    'build-docker-image': 'buildDockerImage',
    'deploy-container': 'deployContainer',
    'deploy-compose': 'deployCompose',
    cleanup: 'cleanup',
    'finalize-logs': 'finalizeLogs',
};

export function ResumeBuildButton({
    buildId,
    mode = 'button',
    lastCompletedStep,
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

    const handleResume = (startFromStep?: BuildStep) => {
        execute({ buildId, startFromStep, environmentId: selectedEnvironmentId! });
    };

    const getNextStep = (): BuildStep | undefined => {
        if (!lastCompletedStep) return undefined;
        const currentIndex = BUILD_STEPS_ORDER.indexOf(lastCompletedStep as BuildStep);
        if (currentIndex === -1 || currentIndex >= BUILD_STEPS_ORDER.length - 1) {
            return undefined;
        }
        return BUILD_STEPS_ORDER[currentIndex + 1];
    };

    const nextStep = getNextStep();

    const stepsMenu = BUILD_STEPS_ORDER.map((step, index) => {
        const lastIndex = lastCompletedStep
            ? BUILD_STEPS_ORDER.indexOf(lastCompletedStep as BuildStep)
            : -1;
        const isCompleted = index <= lastIndex;
        const isNext = index === lastIndex + 1;

        return (
            <DropdownMenuItem
                key={step}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResume(step);
                }}
                className="flex items-center justify-between gap-2"
            >
                <span>{t(`steps.${STEP_KEYS[step]}`)}</span>
                {isCompleted && (
                    <span className="text-muted-foreground text-xs">{t('completedStep')}</span>
                )}
                {isNext && <span className="text-xs text-green-500">{t('nextStep')}</span>}
            </DropdownMenuItem>
        );
    });

    if (mode === 'dropdown') {
        return (
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Play className="size-4" />
                    {t('resume')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuLabel>{t('resumeFromStep')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {stepsMenu}
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        );
    }

    return (
        <div className="flex">
            <Button
                {...props}
                onClick={() => handleResume(nextStep)}
                disabled={isPending}
                className="rounded-r-none"
            >
                {isPending ? <Loader2 className="animate-spin" /> : <Play className="size-4" />}
                {isPending ? t('resuming') : t('resume')}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        {...props}
                        size={'icon'}
                        disabled={isPending}
                        className="rounded-l-none border-l"
                    >
                        <ChevronDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('resumeFromStep')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {stepsMenu}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
