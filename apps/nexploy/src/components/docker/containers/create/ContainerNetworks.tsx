'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Network, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { useNetworksStore } from '../../../../stores/docker/useNetworksStore';

export function ContainerNetworks() {
    const t = useTranslations('docker.createContainer');
    const form = useFormContext();
    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'networks' });

    const networks = useNetworksStore((state) => state.networks);

    const networkOptions = networks.map((net) => ({ value: net.name, label: net.name }));

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Network}
                title={t('networks')}
                description={t('networksDescription')}
            >
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => append('')}
                >
                    <Plus />
                    {t('addNetwork')}
                </Button>
            </CardHeaderWithIcon>
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
                                                    placeholder={t('networkNamePlaceholder')}
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
