'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslations } from 'next-intl';

interface DriverOptionsFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
}

export function DriverOptionsField<T extends FieldValues>({
    control,
    name,
}: DriverOptionsFieldProps<T>) {
    const t = useTranslations('docker.advancedConfig');
    const [optKey, setOptKey] = useState('');
    const [optValue, setOptValue] = useState('');

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const addOption = () => {
                    if (optKey.trim() && optValue.trim()) {
                        const currentOpts = (field.value as Record<string, string>) || {};
                        field.onChange({
                            ...currentOpts,
                            [optKey.trim()]: optValue.trim(),
                        });
                        setOptKey('');
                        setOptValue('');
                    }
                };

                const removeOption = (key: string) => {
                    const currentOpts = (field.value as Record<string, string>) || {};
                    const { [key]: _, ...rest } = currentOpts;
                    field.onChange(rest);
                };

                const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                    }
                };

                return (
                    <FormItem>
                        <FormLabel>{t('driverOptions')}</FormLabel>
                        <FormControl>
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('optionKeyPlaceholder')}
                                        value={optKey}
                                        onChange={(e) => setOptKey(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder={t('optionValuePlaceholder')}
                                        value={optValue}
                                        onChange={(e) => setOptValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={addOption}
                                        disabled={!optKey.trim() || !optValue.trim()}
                                    >
                                        <Plus className="size-4" />
                                    </Button>
                                </div>

                                {field.value && Object.keys(field.value).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">{t('optionsAdded')}</p>
                                        <div className="space-y-2">
                                            {Object.entries(
                                                field.value as Record<string, string>,
                                            ).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="bg-muted/60 flex items-center justify-between rounded-md p-3 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-background rounded px-2 py-1 font-mono text-sm">
                                                            {key}
                                                        </code>
                                                        <span className="text-muted-foreground">
                                                            =
                                                        </span>
                                                        <code className="bg-background rounded px-2 py-1 font-mono text-sm">
                                                            {value}
                                                        </code>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="hover:bg-destructive/10 hover:text-destructive size-8"
                                                        onClick={() => removeOption(key)}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                            {t('optionsDescription')}{' '}
                            <code className="bg-muted rounded px-1 py-0.5 text-xs">type=nfs</code>,{' '}
                            <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                o=addr=192.168.1.1
                            </code>
                            ,{' '}
                            <code className="bg-muted rounded px-1 py-0.5 text-xs">
                                device=/path/to/dir
                            </code>
                        </FormDescription>
                    </FormItem>
                );
            }}
        />
    );
}
