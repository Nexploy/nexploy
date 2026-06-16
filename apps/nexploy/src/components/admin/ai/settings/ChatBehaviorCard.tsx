'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
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
                                        <div className="flex flex-col">
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
                                                    handleSubmitWithAction();
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
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
                                                <span className="text-muted-foreground text-xs">
                                                    {t('maxStepsDescription')}
                                                </span>
                                            </FormLabel>
                                        </div>
                                        <div className={'flex flex-col gap-2'}>
                                            <div className="relative">
                                                <FormControl>
                                                    <Slider
                                                        min={1}
                                                        max={20}
                                                        step={1}
                                                        value={[field.value]}
                                                        disabled={action.isPending}
                                                        onValueChange={(values) =>
                                                            field.onChange(values[0] ?? field.value)
                                                        }
                                                        onValueCommit={() =>
                                                            handleSubmitWithAction()
                                                        }
                                                    />
                                                </FormControl>
                                                <span
                                                    className="text-muted-foreground bg-muted absolute top-full mt-3 -translate-x-1/2 rounded px-1.5 py-0.5 font-mono text-xs"
                                                    style={{
                                                        left: `calc(${((field.value - 1) / 19) * 100}% + ${10 - ((field.value - 1) / 19) * 20}px)`,
                                                    }}
                                                >
                                                    {field.value}
                                                </span>
                                            </div>
                                            <div className="text-muted-foreground relative h-3 text-xs">
                                                {field.value !== 1 && (
                                                    <span className={'absolute left-0'}>1</span>
                                                )}
                                                {field.value !== 20 && (
                                                    <span className={'absolute right-0'}>20</span>
                                                )}
                                            </div>
                                            <FormMessage />
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
