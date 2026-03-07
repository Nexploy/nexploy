'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { NodeConfigProps } from '@/components/pipeline/nodes/NodeConfigPanel';

export function RunScriptConfig({ config, update }: NodeConfigProps) {
    const t = useTranslations('repository.pipeline.config');
    return (
        <>
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">{t('script')}</Label>
                <Textarea
                    value={(config.script as string) ?? ''}
                    onChange={(e) => update('script', e.target.value)}
                    placeholder="echo hello"
                    rows={6}
                    className="border-border bg-background text-foreground focus:border-primary font-mono text-xs"
                />
            </div>
            <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs">{t('failOnError')}</Label>
                <Switch
                    checked={(config.failOnError as boolean) ?? true}
                    onCheckedChange={(v) => update('failOnError', v)}
                />
            </div>
        </>
    );
}
