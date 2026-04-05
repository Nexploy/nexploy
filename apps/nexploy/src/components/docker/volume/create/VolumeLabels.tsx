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

export function VolumeLabels() {
    const t = useTranslations('docker.createVolumePage');
    const form = useFormContext();
    const state = useKeyValueState();

    const handleAdd = () => {
        if (state.key.trim() && state.value.trim()) {
            const current = form.getValues('labels') || {};
            form.setValue('labels', { ...current, [state.key.trim()]: state.value.trim() });
            state.reset();
        }
    };

    const handleRemove = (key: string) => {
        const current = form.getValues('labels') || {};
        const { [key]: _, ...rest } = current;
        form.setValue('labels', rest);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('labels')}</CardTitle>
                <CardDescription>{t('labelsCardDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">{t('labels')}</FormLabel>
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
                                        title={t('labelsAdded')}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                {t('labelsDescription')}{' '}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">env=production</code>
                                ,{' '}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">app=backend</code>
                                ,{' '}
                                <code className="bg-muted rounded px-1 py-0.5 text-xs">team=devops</code>
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
