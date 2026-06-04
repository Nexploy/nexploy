'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { Slider } from '@workspace/ui/components/slider';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateAIChatBehaviorSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAIChatBehaviorAction } from '@/actions/admin/ai/updateAiChatBehavior.action';

interface ChatBehaviorCardProps {
    requireDestructiveConfirmation: boolean;
    maxSteps: number;
}

export function ChatBehaviorCard({
    requireDestructiveConfirmation,
    maxSteps,
}: ChatBehaviorCardProps) {
    const t = useTranslations('ai.admin.settings');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateAIChatBehaviorAction,
        zodResolver(updateAIChatBehaviorSchema),
        {
            formProps: { defaultValues: { requireDestructiveConfirmation, maxSteps } },
            actionProps: {
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={MessageSquare}
                title={t('chatBehavior')}
                description={t('chatBehaviorDescription')}
            />
            <CardContent className="space-y-3">
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="requireDestructiveConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-base">
                                                {t('requireConfirmation')}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('requireConfirmationDescription')}
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
                            name="maxSteps"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-col gap-4 rounded-lg border p-4">
                                        <div className="flex justify-between">
                                            <FormLabel className="flex flex-col items-start gap-0.5">
                                                <span className="text-base">{t('maxSteps')}</span>
                                                <div className={'flex items-end'}>
                                                    <span className="text-muted-foreground text-xs">
                                                        {t('maxStepsDescription')}
                                                    </span>
                                                    <span className="text-muted-foreground bg-muted rounded-md px-2 py-0.5 font-mono text-sm tabular-nums">
                                                        {field.value}
                                                    </span>
                                                </div>
                                            </FormLabel>
                                        </div>
                                        <div className={'flex flex-col gap-2'}>
                                            <FormControl>
                                                <Slider
                                                    {...field}
                                                    min={1}
                                                    max={20}
                                                    step={1}
                                                    value={[field.value]}
                                                    disabled={action.isPending}
                                                    onValueChange={(values) =>
                                                        field.onChange(values[0] ?? field.value)
                                                    }
                                                    onValueCommit={() =>
                                                        void handleSubmitWithAction()
                                                    }
                                                />
                                            </FormControl>
                                            <div className="text-muted-foreground flex justify-between text-xs">
                                                <span>1</span>
                                                <span>20</span>
                                            </div>
                                        </div>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
