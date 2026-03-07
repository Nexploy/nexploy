'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Plus, Trash2 } from 'lucide-react';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';
import { type VarEntry } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import dayjs from 'dayjs';

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

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">{t('vars')}</Label>
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <div key={entry.id} className="flex gap-1.5">
                            <Input
                                value={entry.key}
                                onChange={(e) => updateEntry(entry.id, 'key', e.target.value)}
                                placeholder={t('varKey')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                            <Input
                                value={entry.value}
                                onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
                                placeholder={t('varValue')}
                                className="border-border bg-background text-foreground focus:border-primary h-8 font-mono text-xs"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                onClick={() => removeEntry(entry.id)}
                            >
                                <Trash2 className="size-3" />
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
