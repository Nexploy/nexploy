'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useKeyValueState } from '@/hooks/useKeyValueState';
import { KeyValueInput, KeyValueList } from '@/components/forms/KeyValue';

export function VolumeDriverOptions() {
    const t = useTranslations('docker.createVolumePage');
    const form = useFormContext();
    const state = useKeyValueState();

    const handleAdd = () => {
        if (state.key.trim() && state.value.trim()) {
            const current = form.getValues('driverOpts') || {};
            form.setValue('driverOpts', { ...current, [state.key.trim()]: state.value.trim() });
            state.reset();
        }
    };

    const handleRemove = (key: string) => {
        const current = form.getValues('driverOpts') || {};
        const { [key]: _, ...rest } = current;
        form.setValue('driverOpts', rest);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('driverOptions')}</CardTitle>
                <CardDescription>{t('driverOptionsCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="driverOpts"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">{t('driverOptions')}</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <KeyValueInput
                                            keyValue={state.key}
                                            value={state.value}
                                            onKeyChange={state.setKey}
                                            onValueChange={state.setValue}
                                            keyPlaceholder={t('keyPlaceholder')}
                                            valuePlaceholder={t('valuePlaceholder')}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={handleAdd}
                                            disabled={!state.key.trim() || !state.value.trim()}
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                    <KeyValueList
                                        items={field.value}
                                        onRemove={handleRemove}
                                        title={t('optionsAdded')}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                {t('driverOptionsDescription')}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                    type=nfs
                                </code>
                                ,
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                    o=addr=192.168.1.1
                                </code>
                                ,
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                    device=/path/to/dir
                                </code>
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
