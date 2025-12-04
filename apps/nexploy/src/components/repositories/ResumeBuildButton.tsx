'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ChevronDown, Loader2, Play } from 'lucide-react';
import { onResumeBuild } from '@/actions/repository/builds/resumeBuild.action';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BuildStep, BUILD_STEPS_ORDER } from '@workspace/typescript-interface/inngest/build';

interface ResumeBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    lastCompletedStep?: string | null;
}

const STEP_LABELS: Record<BuildStep, string> = {
    'clone-repository': 'Clone Repository',
    'prepare-dockerfile': 'Prepare Dockerfile',
    'write-env-file': 'Write Env File',
    'build-docker-image': 'Build Docker Image',
    'deploy-container': 'Deploy Container',
    cleanup: 'Cleanup',
    'finalize-logs': 'Finalize',
};

export function ResumeBuildButton({
    buildId,
    lastCompletedStep,
    ...props
}: ResumeBuildButtonProps) {
    const router = useRouter();

    const { execute, isPending } = useAction(onResumeBuild, {
        onSuccess: () => {
            toast.success('Build resumed successfully');
            router.refresh();
        },
    });

    const handleResume = (startFromStep?: BuildStep) => {
        execute({ buildId, startFromStep });
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

    return (
        <div className="flex">
            <Button
                {...props}
                onClick={() => handleResume(nextStep)}
                disabled={isPending}
                className="rounded-r-none"
            >
                {isPending ? <Loader2 className="animate-spin" /> : <Play className="size-4" />}
                {isPending ? 'Resuming...' : 'Resume'}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        {...props}
                        disabled={isPending}
                        className="rounded-l-none border-l px-2"
                    >
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Resume from step</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {BUILD_STEPS_ORDER.map((step, index) => {
                        const lastIndex = lastCompletedStep
                            ? BUILD_STEPS_ORDER.indexOf(lastCompletedStep as BuildStep)
                            : -1;
                        const isCompleted = index <= lastIndex;
                        const isNext = index === lastIndex + 1;

                        return (
                            <DropdownMenuItem
                                key={step}
                                onClick={() => handleResume(step)}
                                className="flex items-center justify-between gap-2"
                            >
                                <span>{STEP_LABELS[step]}</span>
                                {isCompleted && (
                                    <span className="text-muted-foreground text-xs">
                                        (completed)
                                    </span>
                                )}
                                {isNext && (
                                    <span className="text-xs text-green-500">(next)</span>
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
