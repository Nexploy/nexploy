'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Info } from 'lucide-react';

const TRIGGER_OPTIONS = ['success', 'failure', 'always'] as const;
type TriggerOption = (typeof TRIGGER_OPTIONS)[number];

function InfoTooltip({ children }: { children: React.ReactNode }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="text-muted-foreground hover:text-foreground h-3.5 w-3.5 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">{children}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export function SendNotificationConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center gap-1.5">
                            <FormLabel>{t('webhookUrl')}</FormLabel>
                            <InfoTooltip>
                                <p className="mb-1">{t('webhookUrlTooltipDesc')}</p>
                                <pre className="bg-muted text-foreground rounded p-1.5 font-mono text-[10px]">{`{
  "message": "...",
  "pipelineStatus": "success | failure",
  "timestamp": "2026-01-01T00:00:00.000Z"
}`}</pre>
                            </InfoTooltip>
                        </div>
                        <FormControl>
                            <Input {...field} placeholder={t('webhookUrlPlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="triggerOn"
                render={({ field }) => {
                    const value: TriggerOption[] = field.value ?? ['always'];
                    const toggle = (option: TriggerOption) => {
                        const next = value.includes(option)
                            ? value.filter((v) => v !== option)
                            : [...value, option];
                        field.onChange(next);
                    };
                    return (
                        <FormItem>
                            <div className="flex items-center gap-1.5">
                                <FormLabel>{t('triggerOn')}</FormLabel>
                                <InfoTooltip>
                                    <ul className="space-y-0.5">
                                        <li>
                                            <span className="font-medium">
                                                {t('triggerOnSuccess')}
                                            </span>{' '}
                                            — {t('triggerOnSuccessDesc')}
                                        </li>
                                        <li>
                                            <span className="font-medium">
                                                {t('triggerOnFailure')}
                                            </span>{' '}
                                            — {t('triggerOnFailureDesc')}
                                        </li>
                                        <li>
                                            <span className="font-medium">
                                                {t('triggerOnAlways')}
                                            </span>{' '}
                                            — {t('triggerOnAlwaysDesc')}
                                        </li>
                                    </ul>
                                </InfoTooltip>
                            </div>
                            <div className="flex gap-4">
                                {TRIGGER_OPTIONS.map((option) => {
                                    const labelKey = {
                                        success: 'triggerOnSuccess',
                                        failure: 'triggerOnFailure',
                                        always: 'triggerOnAlways',
                                    };
                                    return (
                                        <Label
                                            key={option}
                                            className="flex cursor-pointer items-center gap-1.5 text-xs"
                                        >
                                            <Checkbox
                                                checked={value.includes(option)}
                                                onCheckedChange={() => toggle(option)}
                                            />
                                            {t(labelKey[option])}
                                        </Label>
                                    );
                                })}
                            </div>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />
            <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('message')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder={t('messagePlaceholder')} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
