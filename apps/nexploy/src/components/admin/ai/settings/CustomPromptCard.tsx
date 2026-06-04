'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Textarea } from '@workspace/ui/components/textarea';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateAICustomPromptSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAICustomPromptAction } from '@/actions/admin/ai/updateAiCustomPrompt.action';

interface CustomPromptCardProps {
    customSystemPrompt: string | null;
}

export function CustomPromptCard({ customSystemPrompt }: CustomPromptCardProps) {
    const t = useTranslations('ai.admin.settings');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateAICustomPromptAction,
        zodResolver(updateAICustomPromptSchema),
        {
            formProps: { defaultValues: { customSystemPrompt: customSystemPrompt ?? '' } },
            actionProps: {
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    const value = form.watch('customSystemPrompt');

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Pencil}
                title={t('customPrompt')}
                description={t('customPromptDescription')}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction}>
                        <FormField
                            control={form.control}
                            name="customSystemPrompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="min-h-[120px] resize-y font-mono text-xs"
                                            placeholder={t('customPromptPlaceholder')}
                                            maxLength={4000}
                                            disabled={action.isPending}
                                            onBlur={() => {
                                                field.onBlur();
                                                void handleSubmitWithAction();
                                            }}
                                        />
                                    </FormControl>
                                    <div className="flex items-center justify-between">
                                        <FormMessage />
                                        <p className="text-muted-foreground ml-auto text-xs">
                                            {value.length}/4000
                                        </p>
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
