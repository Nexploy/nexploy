'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Network, Plus, Trash2 } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';

export function NetworkIpamConfig() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'ipam.config',
    });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Network}
                title={t('ipamConfig')}
                description={t('ipamConfigDescription')}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => append({ subnet: '', ipRange: '', gateway: '' })}
                >
                    <Plus />
                    {t('addIpConfig')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="ipam.driver"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('ipamDriver')}</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value ?? ''} placeholder="default" />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>{t('ipamDriverDescription')}</FormDescription>
                        </FormItem>
                    )}
                />

                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                        {t('noIpConfigurationsConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="bg-muted/40 space-y-3 rounded-lg border p-4"
                            >
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold">
                                        {t('configuration')} {index + 1}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`ipam.config.${index}.subnet`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder={t('subnetPlaceholder')}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`ipam.config.${index}.ipRange`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder={t('ipRangePlaceholder')}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`ipam.config.${index}.gateway`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        placeholder={t('gatewayPlaceholder')}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="destructiveGhost"
                                        size="icon"
                                        icon={Trash2}
                                        onClick={() => remove(index)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
