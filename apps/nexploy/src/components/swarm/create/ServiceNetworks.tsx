'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';

export function ServiceNetworks() {
    const t = useTranslations('swarm.createService');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'networks',
    });

    const networks = useNetworkStore((state) => state.networks);
    const networkOptions = networks.map((net) => ({ value: net.name, label: net.name }));

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between">
                    <div className="flex flex-col gap-2">
                        <CardTitle>{t('networks')}</CardTitle>
                        <CardDescription>{t('networksDescription')}</CardDescription>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => append('')}>
                        <Plus />
                        {t('addNetwork')}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        {t('noNetworksConfigured')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3">
                                <FormField
                                    control={form.control}
                                    name={`networks.${index}`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <InputAutoComplete
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={networkOptions}
                                                    heading={t('availableNetworks')}
                                                    placeholder={t('networkPlaceholder')}
                                                    autoComplete="off"
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
