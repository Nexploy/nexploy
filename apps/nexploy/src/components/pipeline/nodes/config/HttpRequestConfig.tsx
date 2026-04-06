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
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Plus, Trash2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import dayjs from 'dayjs';

export function HttpRequestConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'headers' });

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('url')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="https://example.com/webhook"
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('httpMethod')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('httpMethod')}</SelectLabel>
                                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <div className="space-y-2">
                <FormLabel>{t('httpHeaders')}</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-1.5">
                        <FormField
                            control={form.control}
                            name={`headers.${index}.key`}
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
                            name={`headers.${index}.value`}
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
            <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('httpBody')}</FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                value={field.value ?? ''}
                                placeholder='{"key": "value"}'
                                className="border-border bg-background text-foreground focus:border-primary font-mono text-xs"
                                rows={4}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="expectedStatus"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('expectedStatus')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className="border-border bg-background text-foreground focus:border-primary h-8 text-xs"
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="continueOnError"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                        <FormLabel>{t('continueOnError')}</FormLabel>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
