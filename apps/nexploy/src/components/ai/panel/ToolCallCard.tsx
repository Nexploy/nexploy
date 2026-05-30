import React from 'react';
import {
    Bot,
    Check,
    Container,
    GitBranch,
    Layers,
    Loader2,
    Play,
    Terminal,
    X,
} from 'lucide-react';
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
    const isRunning = state === 'input-streaming' || state === 'input-available';
    const isDone = state === 'output-available';
    const Icon = TOOL_ICONS[toolName] ?? Bot;
    const success = output?.success !== false;

    return (
        <div
            className={cn(
                'mt-2 flex items-start gap-2 rounded-lg border p-2 text-xs',
                isDone
                    ? success
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                    : 'bg-muted/50',
            )}
        >
            <div
                className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                    isDone
                        ? success
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-red-500/20 text-red-600'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                {isRunning ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : isDone && success ? (
                    <Check className="h-2.5 w-2.5" />
                ) : isDone && !success ? (
                    <X className="h-2.5 w-2.5" />
                ) : (
                    <Icon className="h-2.5 w-2.5" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <span className="text-muted-foreground font-medium">{toolName}</span>
                {isDone && (output?.message || output?.error) && (
                    <p className={cn('mt-0.5', success ? 'text-foreground/70' : 'text-red-600/80')}>
                        {output.message || output.error}
                    </p>
                )}
            </div>
        </div>
    );
}
