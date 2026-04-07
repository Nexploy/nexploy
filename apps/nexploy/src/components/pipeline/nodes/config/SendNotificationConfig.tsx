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

const TRIGGER_OPTIONS = ['success', 'failure', 'always'] as const;
type TriggerOption = (typeof TRIGGER_OPTIONS)[number];

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
                        <FormLabel>{t('webhookUrl')}</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://hooks.example.com/…" />
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
                            <FormLabel>{t('triggerOn')}</FormLabel>
                            <div className="flex gap-4">
                                {TRIGGER_OPTIONS.map((option) => {
                                    const labelKey = {
                                        success: 'triggerOnSuccess',
                                        failure: 'triggerOnFailure',
                                        always: 'triggerOnAlways',
                                    } as const;
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
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('messagePlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
        </div>
    );
}
