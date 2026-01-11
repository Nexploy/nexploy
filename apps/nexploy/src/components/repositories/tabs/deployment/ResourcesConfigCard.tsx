'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Cpu, HardDrive } from 'lucide-react';
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
import { Separator } from '@workspace/ui/components/separator';
import { useTranslations } from 'next-intl';

interface ResourcesConfigCardProps {
    form: UseFormReturn<DeploymentSettingsForm>;
}

export function ResourcesConfigCard({ form }: ResourcesConfigCardProps) {
    const t = useTranslations('repository.resources');

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-2">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Cpu className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* CPU */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Cpu className="size-4" />
                        <h4 className="font-medium">{t('cpu')}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cpuLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('cpuLimit')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="128"
                                            placeholder={t('notDefined')}
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value
                                                        ? parseFloat(e.target.value)
                                                        : null,
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('cpuLimitDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cpuReservation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('cpuReservation')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="128"
                                            placeholder={t('notDefined')}
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value
                                                        ? parseFloat(e.target.value)
                                                        : null,
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>{t('cpuReservationDescription')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                {/* Memory */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <HardDrive className="size-4" />
                        <h4 className="font-medium">{t('memory')}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="memoryLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('memoryLimit')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="512M, 1G, 2G..."
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(e.target.value || null)
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('memoryLimitDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="memoryReservation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('memoryReservation')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="256M, 512M..."
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(e.target.value || null)
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>{t('memoryReservationDescription')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
