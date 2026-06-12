'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';
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
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('httpUrlPlaceholder')} />
                            </RefAware>
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
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>{t('httpMethod')}</SelectLabel>
                                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {m}
                                        </SelectItem>
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
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <RefAware value={field.value} onChange={field.onChange}>
                                            <Input {...field} placeholder={t('varKey')} />
                                        </RefAware>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`headers.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <RefAware value={field.value} onChange={field.onChange}>
                                            <Input {...field} placeholder={t('varValue')} />
                                        </RefAware>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
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
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Textarea
                                    {...field}
                                    placeholder={t('jsonBodyPlaceholder')}
                                    className="border-border bg-background text-foreground focus:border-primary font-mono text-xs"
                                    rows={4}
                                />
                            </RefAware>
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
                            <Input {...field} type="number" />
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
                            <Switch
                                className={'cursor-pointer'}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
