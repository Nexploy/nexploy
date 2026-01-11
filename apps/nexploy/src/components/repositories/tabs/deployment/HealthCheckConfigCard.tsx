'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { HeartPulse } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { DeploymentSettingsForm } from '@workspace/schemas-zod/repository/settings/deploymentSettings.schema';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { useTranslations } from 'next-intl';

interface HealthCheckConfigCardProps {
    form: UseFormReturn<DeploymentSettingsForm>;
}

export function HealthCheckConfigCard({ form }: HealthCheckConfigCardProps) {
    const t = useTranslations('repository.healthCheck');
    const healthCheckEnabled = form.watch('healthCheckEnabled');

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-2">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <HeartPulse className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>
                            {t('description')}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="healthCheckEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">{t('enable')}</FormLabel>
                                <FormDescription>
                                    {t('enableDescription')}
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {healthCheckEnabled && (
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="healthCheckCommand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('command')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="CMD curl -f http://localhost/ || exit 1"
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(e.target.value || null)
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('commandDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="healthCheckInterval"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('interval')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="30s" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {t('intervalDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="healthCheckTimeout"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('timeout')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10s" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {t('timeoutDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="healthCheckRetries"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('retries')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(parseInt(e.target.value) || 1)
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t('retriesDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="healthCheckStartPeriod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('startPeriod')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0s" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {t('startPeriodDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
