'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, ServerCog, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';

export function ServicePlacement() {
    const t = useTranslations('swarm.createService');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'constraints',
    });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={ServerCog}
                title={t('placement')}
                description={t('placementDescription')}
                className={'justify-between'}
            >
                <Button type="button" size="sm" variant="outline" onClick={() => append('')}>
                    <Plus />
                    {t('addConstraint')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noConstraintsConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3">
                                <FormField
                                    control={form.control}
                                    name={`constraints.${index}`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder={t('constraintPlaceholder')}
                                                    className="font-mono"
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
