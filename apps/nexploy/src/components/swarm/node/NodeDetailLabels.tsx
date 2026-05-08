'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NodeDetailLabelsProps {
    labels: Record<string, string>;
}

export function NodeDetailLabels({ labels }: NodeDetailLabelsProps) {
    const t = useTranslations('swarm');
    const entries = Object.entries(labels);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="size-4" />
                    {t('labels')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('node.noLabels')}</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {entries.map(([key, value]) => (
                            <div key={key} className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground min-w-0 shrink-0 font-mono text-xs">
                                    {key}
                                </span>
                                <span className="truncate font-mono text-xs">{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
