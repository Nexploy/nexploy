'use client';

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

export interface ToolPart {
    toolCallId: string;
    toolName: string;
    state: string;
    output?: unknown;
}

interface ToolCallRowProps {
    tool: ToolPart;
}

export function ToolCallRow({ tool }: ToolCallRowProps) {
    const t = useTranslations('ai.chat.toolCall');
    const Icon = TOOL_ICONS[tool.toolName] ?? Bot;
    const isRunning = tool.state === 'input-streaming' || tool.state === 'input-available';
    const isDone = tool.state === 'output-available';
    const output = tool.output as { success?: boolean } | undefined;
    const success = output?.success !== false;

    return (
        <div className="flex items-center gap-2 px-1 py-1">
            <div
                className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded',
                    isRunning && 'bg-primary/10 text-primary',
                    isDone && success && 'bg-green-500/15 text-green-500',
                    isDone && !success && 'bg-red-500/15 text-red-500',
                    !isRunning && !isDone && 'bg-muted text-muted-foreground',
                )}
            >
                <Icon className="h-2.5 w-2.5" />
            </div>

            <span className="text-foreground/70 flex-1 truncate font-mono text-[11px]">
                {tool.toolName}
            </span>

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
    );
}
