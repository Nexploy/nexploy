'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { useImageStore } from '@/stores/docker/useImageStore.ts';
import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';

export function CardImageConfig() {
    const t = useTranslations('docker.imageConfig');
    const image = useImageStore((state) => state.image);

    if (!image) return <Skeleton className="h-60" />;

    const config = image.config;

    if (!config) {
        return <Skeleton className="h-60" />;
    }

    const envVars = (config.env || []).map((env) => {
        const eqIndex = env.indexOf('=');
        if (eqIndex === -1) return { key: env, value: '' };
        return { key: env.substring(0, eqIndex), value: env.substring(eqIndex + 1) };
    });

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell className="w-32 font-medium text-muted-foreground">{t('cmd')}</TableCell>
                            <TableCell className={'max-w-0 truncate'}>
                                <code>{config.cmd?.join(' ') || t('noCmd')}</code>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="w-32 font-medium text-muted-foreground">{t('entrypoint')}</TableCell>
                            <TableCell className={'max-w-0 truncate'}>
                                <code>{config.entrypoint?.join(' ') || t('noEntrypoint')}</code>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="w-32 align-top font-medium text-muted-foreground">
                                {t('env')}
                            </TableCell>
                            <TableCell className={'max-w-0'}>
                                {envVars.length ? (
                                    <div className="flex flex-col gap-1">
                                        {envVars.map(({ key, value }) => (
                                            <div key={key} className="flex gap-2 font-mono text-sm">
                                                <span className="shrink-0 text-muted-foreground">{key}</span>
                                                <span className="truncate">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('noEnv')}</span>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
