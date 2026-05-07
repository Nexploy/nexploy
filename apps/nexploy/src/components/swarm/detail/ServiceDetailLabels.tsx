'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ServiceDetailLabelsProps {
    labels: Record<string, string>;
}

export function ServiceDetailLabels({ labels }: ServiceDetailLabelsProps) {
    const t = useTranslations('swarm');

    const entries = Object.entries(labels);

    if (entries.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="size-4" />
                    {t('detail.labelsTitle')}
                    <Badge variant="secondary" className="ml-1">
                        {entries.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                    {entries.map(([key, value]) => (
                        <div
                            key={key}
                            className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-xs"
                        >
                            <span className="text-primary min-w-0 truncate font-semibold">
                                {key}
                            </span>
                            <span className="text-muted-foreground shrink-0">=</span>
                            <span className="min-w-0 truncate">{value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
