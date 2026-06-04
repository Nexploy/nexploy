'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateAIMcpPermissionsSchema } from '@workspace/schemas-zod/ai/aiSettings.schema';
import { updateAIMcpPermissionsAction } from '@/actions/admin/ai/updateAiMcpPermissions.action';

interface McpPermissionsCardProps {
    allowExecInContainer: boolean;
    allowSwarmOperations: boolean;
}

export function McpPermissionsCard({
    allowExecInContainer,
    allowSwarmOperations,
}: McpPermissionsCardProps) {
    const t = useTranslations('ai.admin.settings');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateAIMcpPermissionsAction,
        zodResolver(updateAIMcpPermissionsSchema),
        {
            formProps: { defaultValues: { allowExecInContainer, allowSwarmOperations } },
            actionProps: {
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={ShieldCheck}
                title={t('mcpPermissions')}
                description={t('mcpPermissionsDescription')}
            />
            <CardContent className="space-y-3">
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="allowExecInContainer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer justify-between rounded-lg border p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-base">
                                                {t('allowExecInContainer')}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('allowExecInContainerDescription')}
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
                            name="allowSwarmOperations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer justify-between rounded-lg border p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-base">
                                                {t('allowSwarmOperations')}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('allowSwarmOperationsDescription')}
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
