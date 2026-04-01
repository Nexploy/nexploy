'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Plus, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

export function TemplateFileConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'variables' });

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="inputPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('templateInputPath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="template.yaml"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="outputPath"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('templateOutputPath')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="output.yaml"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <div className="space-y-2">
                <FormLabel>{t('templateVariables')}</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-1.5">
                        <FormField
                            control={form.control}
                            name={`variables.${index}.key`}
                            render={({ field: f }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input {...f} placeholder={t('varKey')} className="h-7 font-mono text-xs" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`variables.${index}.value`}
                            render={({ field: f }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input {...f} placeholder={t('varValue')} className="h-7 font-mono text-xs" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="destructiveGhost" size="icon" onClick={() => remove(index)}>
                            <Trash2 />
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => append({ id: `${dayjs().valueOf()}`, key: '', value: '' })}
                >
                    <Plus className="size-3" /> {t('addVar')}
                </Button>
            </div>
        </div>
    );
}
