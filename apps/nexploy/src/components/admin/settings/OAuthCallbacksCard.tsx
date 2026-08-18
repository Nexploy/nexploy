'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, KeyRound, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import CopyButton from '@/components/shared/CopyButton';
import type { InstanceCallbackKind, InstanceCallbackTarget } from '@/lib/instance/oauthCallbacks';

const KIND_LABEL_KEYS: Record<InstanceCallbackKind, string> = {
    oauthCallback: 'callbackKindOauthCallback',
    setupRedirect: 'callbackKindSetupRedirect',
    webhook: 'callbackKindWebhook',
    homepage: 'callbackKindHomepage',
};

export function OAuthCallbacksCard({ targets }: { targets: InstanceCallbackTarget[] }) {
    const t = useTranslations('admin.settings');

    if (targets.length === 0) return null;

    return (
        <Card>
            <CardHeaderWithIcon icon={KeyRound} title={t('callbacksTitle')} description={t('callbacksDescription')} />
            <CardContent className="flex flex-col gap-4">
                <p className="text-muted-foreground text-sm">{t('callbacksHint')}</p>

                {targets.map((target) => (
                    <div key={target.providerId} className="flex flex-col gap-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{target.displayName}</span>
                                <Badge variant="outline" className="text-xs">
                                    {target.isGitHubApp ? t('callbacksGitHubApp') : t('callbacksOauthApp')}
                                </Badge>
                            </div>
                            {target.settingsUrl && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={target.settingsUrl} target="_blank" rel="noreferrer">
                                        {t('callbacksOpenSettings')}
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            {target.urls.map((url) => (
                                <div key={url.kind} className="flex items-center gap-2">
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                            {t(KIND_LABEL_KEYS[url.kind])}
                                            {url.automatic && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-500/50 bg-green-500/10 text-[10px] text-green-600"
                                                >
                                                    <RefreshCw className="mr-1 size-2.5" />
                                                    {t('callbacksAutomatic')}
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="truncate font-mono text-xs">{url.value}</span>
                                    </div>
                                    <CopyButton text={url.value} size="icon" className="size-8 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
