import React from 'react';
import { Bot, Check, Container, GitBranch, Layers, Loader2, Play, Terminal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';

const TOOL_ICONS: Record<string, React.ElementType> = {
    listContainers: Container,
    containerAction: Terminal,
    createContainer: Container,
    getContainerLogs: Terminal,
    execInContainer: Terminal,
    listImages: Layers,
    pullImage: Layers,
    listVolumes: Layers,
    createVolume: Layers,
    createNetwork: Layers,
    listRepositories: GitBranch,
    triggerRepositoryBuild: Play,
};

interface ToolCallCardProps {
    toolName: string;
    state: string;
    output: any;
}

export function ToolCallCard({ toolName, state, output }: ToolCallCardProps) {
    const t = useTranslations('ai.chat.toolCall');
    const isRunning = state === 'input-streaming' || state === 'input-available';
    const isDone = state === 'output-available';
    const Icon = TOOL_ICONS[toolName] ?? Bot;
    const success = output?.success !== false;

    return (
        <div
            className={cn(
                'mt-2 overflow-hidden rounded-md border text-xs transition-colors',
                isDone
                    ? success
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                    : 'border-border/40 bg-background/40',
            )}
        >
            <div className="flex items-center gap-1 px-2 py-1.5">
                <div
                    className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded',
                        isDone
                            ? success
                                ? 'bg-green-500/15 text-green-500'
                                : 'bg-red-500/15 text-red-500'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    <Icon className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                    <span
                        className={cn(
                            'font-mono font-medium tracking-tight',
                            isDone && !success ? 'text-red-500' : 'text-foreground/80',
                        )}
                    >
                        {toolName}
                    </span>
                    {isDone && (output?.message || output?.error) && (
                        <p
                            className={cn(
                                'mt-0.5 truncate text-[10px]',
                                success ? 'text-muted-foreground' : 'text-red-500/70',
                            )}
                        >
                            {output.message ?? output.error}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        'flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        isRunning && 'bg-primary/10 text-primary',
                        isDone && success && 'bg-green-500/10 text-green-600',
                        isDone && !success && 'bg-red-500/10 text-red-500',
                        !isRunning && !isDone && 'bg-muted text-muted-foreground',
                    )}
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            {t('running')}
                        </>
                    ) : isDone && success ? (
                        <>
                            <Check className="h-2.5 w-2.5" />
                            {t('done')}
                        </>
                    ) : isDone && !success ? (
                        <>
                            <X className="h-2.5 w-2.5" />
                            {t('error')}
                        </>
                    ) : (
                        t('pending')
                    )}
                </div>
            </div>

            {isRunning && (
                <div className="bg-border/30 h-px w-full overflow-hidden">
                    <div className="bg-primary/50 h-full w-1/2 animate-pulse" />
                </div>
            )}
        </div>
    );
}
