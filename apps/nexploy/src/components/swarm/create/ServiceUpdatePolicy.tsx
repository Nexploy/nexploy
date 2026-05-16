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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { RefreshCw } from 'lucide-react';

export function ServiceUpdatePolicy() {
    const t = useTranslations('swarm.createService');
    const form = useFormContext();

    return (
        <Card>
            <CardHeaderWithIcon
                icon={RefreshCw}
                title={t('updatePolicy')}
                description={t('updatePolicyDescription')}
            />
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="updateParallelism"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('parallelism')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        {...field}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ''
                                                    ? 1
                                                    : parseInt(e.target.value, 10),
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormDescription>{t('parallelismDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="updateDelay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('updateDelay')}</FormLabel>
                                <FormControl>
                                    <Input
                                        className="font-mono"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>{t('updateDelayDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="updateFailureAction"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('failureAction')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('failureAction')}</SelectLabel>
                                            <SelectItem value="pause">
                                                {t('failureActionPause')}
                                            </SelectItem>
                                            <SelectItem value="continue">
                                                {t('failureActionContinue')}
                                            </SelectItem>
                                            <SelectItem value="rollback">
                                                {t('failureActionRollback')}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="updateOrder"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('updateOrder')}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('updateOrder')}</SelectLabel>
                                            <SelectItem value="stop-first">
                                                {t('updateOrderStopFirst')}
                                            </SelectItem>
                                            <SelectItem value="start-first">
                                                {t('updateOrderStartFirst')}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className={'flex flex-col gap-3'}>
                    <div className={'flex flex-col'}>
                        <p className="text-sm font-medium">{t('restartPolicy')}</p>
                        <p className="text-muted-foreground text-xs">
                            {t('restartPolicyDescription')}
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="restartCondition"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('restartCondition')}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t('restartCondition')}</SelectLabel>
                                                <SelectItem value="none">
                                                    {t('restartConditionNone')}
                                                </SelectItem>
                                                <SelectItem value="on-failure">
                                                    {t('restartConditionOnFailure')}
                                                </SelectItem>
                                                <SelectItem value="any">
                                                    {t('restartConditionAny')}
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="restartMaxAttempts"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('maxAttempts')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ''
                                                        ? 0
                                                        : parseInt(e.target.value, 10),
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>{t('maxAttemptsDescription')}</FormDescription>
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
