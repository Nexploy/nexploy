'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Loader2, Wrench, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { ToolCallRow, type ToolPart } from '@/components/ai/panel/ToolCallRow';

interface ToolCallsSectionProps {
    tools: ToolPart[];
}

export function ToolCallsSection({ tools }: ToolCallsSectionProps) {
    const t = useTranslations('ai.chat.toolCall');
    const [isOpen, setIsOpen] = useState(true);

    const isAnyRunning = tools.some(
        (p) => p.state === 'input-streaming' || p.state === 'input-available',
    );
    const allDone = tools.every((p) => p.state === 'output-available');
    const hasError = tools.some(
        (p) =>
            p.state === 'output-available' &&
            (p.output as { success?: boolean })?.success === false,
    );
    const lastTool = tools[tools.length - 1];
    const lastIsRunning =
        lastTool?.state === 'input-streaming' || lastTool?.state === 'input-available';
    const lastIsDone = lastTool?.state === 'output-available';
    const lastOutput = lastTool?.output as { success?: boolean } | undefined;
    const lastSuccess = lastOutput?.success !== false;

    useEffect(() => {
        if (isAnyRunning) {
            setIsOpen(true);
        }
    }, [isAnyRunning]);

    useEffect(() => {
        if (!allDone) return;
        const timer = setTimeout(() => setIsOpen(false), 1000);
        return () => clearTimeout(timer);
    }, [allDone]);

    if (tools.length === 0) return null;

    return (
        <div className="border-border/30 bg-background/30 mb-2 overflow-hidden rounded-lg border">
            <button
                onClick={() => setIsOpen((o) => !o)}
                className="hover:bg-muted/30 flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors"
            >
                <Wrench className="text-muted-foreground h-3 w-3 shrink-0" />
                <span className="text-foreground/60 text-[11px] font-medium">
                    {t('toolsCount', { count: tools.length })}
                </span>
                <span className="text-muted-foreground/40 text-[11px]">·</span>
                <div
                    className={cn(
                        'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        lastIsRunning && 'bg-primary/10 text-primary',
                        lastIsDone && lastSuccess && 'bg-green-500/10 text-green-600',
                        lastIsDone && !lastSuccess && 'bg-red-500/10 text-red-500',
                        !lastIsRunning && !lastIsDone && 'bg-muted text-muted-foreground',
                    )}
                >
                    {lastIsRunning ? (
                        <>
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            {lastTool?.toolName}
                        </>
                    ) : lastIsDone && lastSuccess ? (
                        <>
                            <Check className="h-2.5 w-2.5" />
                            {hasError ? t('partialError') : t('done')}
                        </>
                    ) : lastIsDone && !lastSuccess ? (
                        <>
                            <X className="h-2.5 w-2.5" />
                            {t('error')}
                        </>
                    ) : (
                        t('pending')
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        'text-muted-foreground ml-auto h-3 w-3 shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180',
                    )}
                />
            </button>
            <div
                className={cn(
                    'overflow-hidden transition-all duration-200',
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                )}
            >
                <div className="border-border/20 border-t px-1.5 py-1">
                    {tools.map((tool) => (
                        <ToolCallRow key={tool.toolCallId} tool={tool} />
                    ))}
                </div>
            </div>
        </div>
    );
}
