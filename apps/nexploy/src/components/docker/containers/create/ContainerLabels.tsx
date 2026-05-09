'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Tags, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input.tsx';

export function ContainerLabels() {
    const t = useTranslations('docker.createContainer');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'labels' });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Tags}
                title={t('labels')}
                description={t('labelsDescription')}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => append({ key: '', value: '' })}
                >
                    <Plus />
                    {t('addLabel')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noLabelsConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3">
                                <FormField
                                    control={form.control}
                                    name={`labels.${index}.key`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder={t('labelKeyPlaceholder')}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground">=</span>
                                <FormField
                                    control={form.control}
                                    name={`labels.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder={t('labelValuePlaceholder')}
                                                    {...field}
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
