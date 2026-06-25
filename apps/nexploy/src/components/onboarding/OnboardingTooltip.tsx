'use client';

import { X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import type { TooltipRenderProps } from 'react-joyride';

export function OnboardingTooltip({
    backProps,
    closeProps,
    continuous,
    index,
    isLastStep,
    primaryProps,
    size,
    skipProps,
    step,
    tooltipProps,
}: TooltipRenderProps) {
    return (
        <div
            {...tooltipProps}
            className="bg-popover text-popover-foreground max-w-[400px] rounded-xl border shadow-lg"
        >
            <button
                {...closeProps}
                className="text-muted-foreground hover:bg-accent hover:text-foreground absolute end-3 top-3 flex size-7 items-center justify-center rounded-md transition-colors"
            >
                <X className="size-4" />
            </button>

            <div className="flex flex-col gap-2 p-5 pe-10">
                {step.title && (
                    <h3 className="text-base leading-none font-semibold tracking-tight">
                        {step.title}
                    </h3>
                )}
                <div className="text-muted-foreground text-sm leading-relaxed">{step.content}</div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t p-3">
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: size }).map((_, dotIndex) => (
                        <span
                            key={dotIndex}
                            className={cn(
                                'size-1.5 rounded-full transition-colors',
                                dotIndex === index ? 'bg-primary' : 'bg-muted-foreground/30',
                            )}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {!isLastStep && (
                        <Button {...skipProps} variant="ghost" size="sm">
                            {skipProps.title}
                        </Button>
                    )}
                    {index > 0 && (
                        <Button {...backProps} variant="outline" size="sm">
                            {backProps.title}
                        </Button>
                    )}
                    {continuous && (
                        <Button {...primaryProps} size="sm">
                            {primaryProps.title}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
