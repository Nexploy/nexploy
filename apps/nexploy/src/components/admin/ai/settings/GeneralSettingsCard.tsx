'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Power, Server } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateAIGeneralSettingsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAIGeneralSettingsAction } from '@/actions/admin/ai/updateAiGeneralSettings.action';

interface GeneralSettingsCardProps {
    aiEnabled: boolean;
    mcpEnabled: boolean;
}

export function GeneralSettingsCard({ aiEnabled, mcpEnabled }: GeneralSettingsCardProps) {
    const t = useTranslations('ai.admin.settings');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateAIGeneralSettingsAction,
        zodResolver(updateAIGeneralSettingsSchema),
        {
            formProps: { defaultValues: { aiEnabled, mcpEnabled } },
            actionProps: {
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Power}
                title={t('generalSection')}
                description={t('generalSectionDescription')}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-2">
                        <FormField
                            control={form.control}
                            name="aiEnabled"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-base">{t('aiEnabled')}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('aiEnabledDescription')}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                disabled={action.isPending}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    void handleSubmitWithAction();
                                                }}
                                            />
                                        </FormControl>
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="mcpEnabled"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                                                <Server className="size-4" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-base">{t('mcpEnabled')}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    {t('mcpEnabledDescription')}
                                                </span>
                                            </div>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                disabled={action.isPending}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    void handleSubmitWithAction();
                                                }}
                                            />
                                        </FormControl>
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
