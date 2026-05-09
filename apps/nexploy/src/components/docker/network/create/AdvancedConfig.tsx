'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { SlidersHorizontal } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { KeyValueInput, KeyValueList } from '@/components/forms/KeyValue';
import { Button } from '@workspace/ui/components/button';
import { useKeyValueState } from '@/hooks/useKeyValueState';
import { Badge } from '@workspace/ui/components/badge.tsx';

export function AdvancedConfig() {
    const t = useTranslations('docker.advancedConfig');
    const form = useFormContext();
    const optionState = useKeyValueState();
    const labelState = useKeyValueState();

    const handleAddOption = () => {
        if (optionState.key.trim() && optionState.value.trim()) {
            const currentOpts = form.getValues('options') || {};
            form.setValue('options', {
                ...currentOpts,
                [optionState.key.trim()]: optionState.value.trim(),
            });
            optionState.reset();
        }
    };

    const handleRemoveOption = (key: string) => {
        const currentOpts = form.getValues('options') || {};
        const { [key]: _, ...rest } = currentOpts;
        form.setValue('options', rest);
    };

    const handleAddLabel = () => {
        if (labelState.key.trim() && labelState.value.trim()) {
            const currentLabels = form.getValues('labels') || {};
            form.setValue('labels', {
                ...currentLabels,
                [labelState.key.trim()]: labelState.value.trim(),
            });
            labelState.reset();
        }
    };

    const handleRemoveLabel = (key: string) => {
        const currentLabels = form.getValues('labels') || {};
        const { [key]: _, ...rest } = currentLabels;
        form.setValue('labels', rest);
    };

    return (
        <Card>
            <CardHeaderWithIcon
                icon={SlidersHorizontal}
                title={t('title')}
                description={t('description')}
            />
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('driverOptions')}</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                    <KeyValueInput
                                        keyValue={optionState.key}
                                        value={optionState.value}
                                        onKeyChange={optionState.setKey}
                                        onValueChange={optionState.setValue}
                                        keyPlaceholder={t('optionKeyPlaceholder')}
                                        valuePlaceholder={t('optionValuePlaceholder')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddOption}
                                        disabled={
                                            !optionState.key.trim() || !optionState.value.trim()
                                        }
                                    >
                                        {t('addOption')}
                                    </Button>
                                    <KeyValueList
                                        items={field.value}
                                        onRemove={handleRemoveOption}
                                        title={t('optionsAdded')}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                {t('optionsDescription')}{' '}
                                <Badge variant={'secondary'}>
                                    com.docker.network.bridge.name=br0
                                </Badge>
                            </FormDescription>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('labels')}</FormLabel>
                            <FormControl>
                                <div className="space-y-3">
                                    <KeyValueInput
                                        keyValue={labelState.key}
                                        value={labelState.value}
                                        onKeyChange={labelState.setKey}
                                        onValueChange={labelState.setValue}
                                        keyPlaceholder={t('labels')}
                                        valuePlaceholder={t('labels')}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddLabel}
                                        disabled={
                                            !labelState.key.trim() || !labelState.value.trim()
                                        }
                                    >
                                        {t('addLabel')}
                                    </Button>
                                    <KeyValueList
                                        items={field.value}
                                        onRemove={handleRemoveLabel}
                                        title={t('labelsAdded')}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                {t('labelsDescription')}{' '}
                                <Badge variant={'secondary'}>env=production</Badge>
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
