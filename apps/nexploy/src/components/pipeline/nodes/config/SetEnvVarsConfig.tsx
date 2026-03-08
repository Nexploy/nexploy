'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';
import { type VarEntry } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import dayjs from 'dayjs';
import { useState } from 'react';

function toEntries(raw: unknown): VarEntry[] {
    if (Array.isArray(raw)) return raw as VarEntry[];
    if (raw && typeof raw === 'object') {
        return Object.entries(raw as Record<string, string>).map(([key, value]) => ({
            id: `${key}-${Math.random()}`,
            key,
            value,
        }));
    }
    return [];
}

export function SetEnvVarsConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});

    const entries = toEntries(config.vars);

    const updateEntries = (next: VarEntry[]) => update('vars', next);

    const updateEntry = (id: string, field: 'key' | 'value', val: string) => {
        updateEntries(entries.map((e) => (e.id === id ? { ...e, [field]: val } : e)));
    };

    const removeEntry = (id: string) => {
        updateEntries(entries.filter((e) => e.id !== id));
    };

    const addEntry = () => {
        updateEntries([...entries, { id: `${dayjs().valueOf()}`, key: '', value: '' }]);
    };

    const toggleShowValue = (index: number) => {
        setShowValues((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">{t('vars')}</Label>
                <div className="space-y-2">
                    {entries.map((entry, index) => (
                        <div key={entry.id} className="flex gap-1.5">
                            <Input
                                value={entry.key}
                                onChange={(e) => updateEntry(entry.id, 'key', e.target.value)}
                                placeholder={t('varKey')}
                                className={'flex-1 font-mono'}
                            />

                            <div className="relative flex-1">
                                <Input
                                    value={entry.value}
                                    type={showValues[index] ? 'text' : 'password'}
                                    onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
                                    placeholder={t('varValue')}
                                    className="pr-10 font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1/2 right-1 -translate-y-1/2"
                                    onClick={() => toggleShowValue(index)}
                                >
                                    {showValues[index] ? <Eye /> : <EyeOff />}
                                </Button>
                            </div>

                            <Button
                                variant="destructiveGhost"
                                size="icon"
                                onClick={() => removeEntry(entry.id)}
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={addEntry}>
                <Plus className="size-3" />
                {t('addVar')}
            </Button>
        </div>
    );
}
