'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Cpu, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';

export function VolumeDriverOptions() {
    const t = useTranslations('docker.createVolumePage');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'driverOpts',
    });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Cpu}
                title={t('driverOptions')}
                description={t('driverOptionsCardDescription')}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => append({ key: '', value: '' })}
                >
                    <Plus />
                    {t('addOption')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noDriverOptionsConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3">
                                <FormField
                                    control={form.control}
                                    name={`driverOpts.${index}.key`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('keyPlaceholder')}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground pt-1">=</span>
                                <FormField
                                    control={form.control}
                                    name={`driverOpts.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t('valuePlaceholder')}
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
                                    className="self-start"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
