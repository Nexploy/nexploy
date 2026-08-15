'use client';

import { useTranslations } from 'next-intl';
import { Key, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@workspace/ui/components/button';
import type { McpApiKey } from '@workspace/typescript-interface/ai/mcpApiKey';

interface MCPKeyCardProps {
    k: McpApiKey;
    onRevoke: (id: string) => void;
}

export function MCPKeyCard({ k, onRevoke }: MCPKeyCardProps) {
    const t = useTranslations('ai.admin.mcp');

    return (
        <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <Key className="size-4 text-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium font-mono text-sm">{k.name ?? k.start ?? '••••••'}</span>
                    <span className="text-muted-foreground text-xs">
                        {k.start ?? '••••••'}… · {t('createdAt')} {dayjs(k.createdAt).format('DD/MM/YYYY')}
                        {k.expiresAt && (
                            <>
                                {' · '}
                                {t('expiresAt')} {dayjs(k.expiresAt).format('DD/MM/YYYY')}
                            </>
                        )}
                    </span>
                </div>
            </div>
            <Button
                variant="destructiveOutline"
                size="icon"
                onClick={() => onRevoke(k.id)}
                icon={Trash2}
                title={t('revokeKey')}
            />
        </div>
    );
}
