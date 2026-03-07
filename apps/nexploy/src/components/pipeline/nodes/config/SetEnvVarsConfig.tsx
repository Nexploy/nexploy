'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Plus, Trash2 } from 'lucide-react';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function SetEnvVarsConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    const vars = (config.vars as Record<string, string>) ?? {};
    const entries = Object.entries(vars);

    const setVar = (key: string, value: string) => {
        update('vars', { ...vars, [key]: value });
    };

    const removeVar = (key: string) => {
        const next = { ...vars };
        delete next[key];
        update('vars', next);
    };

    const addVar = () => {
        const key = `VAR_${entries.length + 1}`;
        update('vars', { ...vars, [key]: '' });
    };

    return (
        <div className="space-y-3">
            <Label className="text-muted-foreground text-xs">{t('vars')}</Label>
            <div className="space-y-2">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex gap-1.5">
                        <Input
                            value={key}
                            onChange={(e) => {
                                const next = { ...vars };
                                delete next[key];
                                next[e.target.value] = value;
                                update('vars', next);
                            }}
                            placeholder={t('varKey')}
                            className="border-border bg-background text-foreground focus:border-primary h-7 w-1/2 font-mono text-xs"
                        />
                        <Input
                            value={value}
                            onChange={(e) => setVar(key, e.target.value)}
                            placeholder={t('varValue')}
                            className="border-border bg-background text-foreground focus:border-primary h-7 w-1/2 font-mono text-xs"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            onClick={() => removeVar(key)}
                        >
                            <Trash2 className="size-3" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button variant="outline" size="sm" className="h-7 w-full text-xs" onClick={addVar}>
                <Plus className="size-3" />
                {t('addVar')}
            </Button>
        </div>
    );
}
