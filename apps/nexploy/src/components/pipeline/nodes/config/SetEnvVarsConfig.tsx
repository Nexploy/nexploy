'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import dayjs from 'dayjs';

export function SetEnvVarsConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'vars' });
    const [showValues, setShowValues] = useState<Record<number, boolean>>({});

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">{t('vars')}</Label>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-1.5">
                            <FormField
                                control={form.control}
                                name={`vars.${index}.key`}
                                render={({ field: f }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input {...f} placeholder={t('varKey')} className="font-mono" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`vars.${index}.value`}
                                render={({ field: f }) => (
                                    <FormItem className="relative flex-1">
                                        <FormControl>
                                            <Input {...f} type={showValues[index] ? 'text' : 'password'} placeholder={t('varValue')} className="pr-10 font-mono" />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-1/2 right-1 -translate-y-1/2"
                                            onClick={() => setShowValues((p) => ({ ...p, [index]: !p[index] }))}
                                        >
                                            {showValues[index] ? <Eye /> : <EyeOff />}
                                        </Button>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="destructiveGhost" size="icon" onClick={() => remove(index)}>
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => append({ id: `${dayjs().valueOf()}`, key: '', value: '' })}>
                <Plus className="size-3" />
                {t('addVar')}
            </Button>
        </div>
    );
}
