'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Activity } from 'lucide-react';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';

export function ServiceResources() {
    const t = useTranslations('swarm.createService');
    const form = useFormContext();

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Activity}
                title={t('resources')}
                description={t('resourcesDescription')}
            />
            <CardContent className="space-y-6">
                <div>
                    <p className="mb-3 text-sm font-medium">{t('limits')}</p>
                    <p className="text-muted-foreground mb-4 text-xs">{t('limitsDescription')}</p>
                    <div className="grid items-start gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="cpuLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('cpuLimit')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('cpuLimitPlaceholder')}
                                            className="font-mono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>{t('cpuLimitDescription')}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="memoryLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('memoryLimit')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('memoryLimitPlaceholder')}
                                            className="font-mono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-sm font-medium">{t('reservations')}</p>
                    <p className="text-muted-foreground mb-4 text-xs">
                        {t('reservationsDescription')}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="cpuReservation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('cpuReservation')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('cpuLimitPlaceholder')}
                                            className="font-mono"
                                            {...field}
                                        />
                                    </FormControl>
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
                                            placeholder={t('memoryLimitPlaceholder')}
                                            className="font-mono"
                                            {...field}
                                        />
                                    </FormControl>
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
