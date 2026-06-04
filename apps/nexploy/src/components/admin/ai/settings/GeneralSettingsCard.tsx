'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Power } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateAIGeneralSettingsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAIGeneralSettingsAction } from '@/actions/admin/ai/updateAiGeneralSettings.action';

interface GeneralSettingsCardProps {
    aiEnabled: boolean;
}

export function GeneralSettingsCard({ aiEnabled }: GeneralSettingsCardProps) {
    const t = useTranslations('ai.admin.settings');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateAIGeneralSettingsAction,
        zodResolver(updateAIGeneralSettingsSchema),
        {
            formProps: { defaultValues: { aiEnabled } },
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
                    <form onSubmit={handleSubmitWithAction}>
                        <FormField
                            control={form.control}
                            name="aiEnabled"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className={'text-base'}>{t('aiEnabled')}</span>
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
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
