'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { cn } from '@workspace/ui/lib/utils';
import { updateAiConfigAction } from '@/actions/admin/ai/updateAiConfig.action';
import { upsertProviderApiKeySchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';

interface ModelProviderCardProps {
    provider: Provider;
    label: string;
    color: string;
    icon: React.ReactNode;
    apiKey: string | null;
}

export function ModelProviderCard({
    provider,
    label,
    color,
    icon,
    apiKey: initialApiKey,
}: ModelProviderCardProps) {
    const t = useTranslations('ai.admin.models');
    const tCommon = useTranslations('common');
    const router = useRouter();

    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    const { form, handleSubmitWithAction } = useHookFormAction(
        updateAiConfigAction,
        zodResolver(upsertProviderApiKeySchema),
        {
            formProps: {
                defaultValues: {
                    provider,
                    apiKey: initialApiKey ?? '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                    toast.success(t('saveSuccess'));
                    router.refresh();
                },
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="bg-card rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 p-4">
                    <div
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-lg text-white',
                            color,
                        )}
                    >
                        {icon}
                    </div>
                    <span className="font-semibold">{label}</span>
                </div>

                <Separator />

                <div className="flex items-end gap-3 p-4">
                    <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                    {t('apiKey')}
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            value={field.value ?? ''}
                                            type={showKey ? 'text' : 'password'}
                                            placeholder={t('apiKeyPlaceholder')}
                                            className="pr-9 font-mono text-sm"
                                            disabled={form.formState.isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                                            onClick={() => setShowKey((v) => !v)}
                                        >
                                            {showKey ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={form.formState.isSubmitting || !form.formState.isDirty}
                        className="shrink-0"
                    >
                        {form.formState.isSubmitting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : saved ? (
                            <Check className="size-3.5" />
                        ) : null}
                        {tCommon('save')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
