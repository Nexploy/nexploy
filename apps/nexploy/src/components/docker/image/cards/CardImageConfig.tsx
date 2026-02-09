'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { List } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { getImageDetail } from '@/actions/docker/image/imageDetail.action';
import { ImageDetail } from '@workspace/typescript-interface/docker/docker.image';

interface CardImageConfigProps {
    imageId: string;
}

export function CardImageConfig({ imageId }: CardImageConfigProps) {
    const t = useTranslations('docker.imageConfig');
    const [imageDetail, setImageDetail] = useState<ImageDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getImageDetail({ imageId }).then((result) => {
            if (result?.data) setImageDetail(result.data);
            setLoading(false);
        });
    }, [imageId]);

    if (loading) {
        return <Skeleton className="h-60" />;
    }

    if (!imageDetail) {
        return null;
    }

    const { config } = imageDetail;

    const envVars = (config.env || []).map((env) => {
        const eqIndex = env.indexOf('=');
        if (eqIndex === -1) return { key: env, value: '' };
        return { key: env.substring(0, eqIndex), value: env.substring(eqIndex + 1) };
    });

    return (
        <Card>
            <CardHeaderWithIcon icon={List} title={t('title')} />
            <CardContent>
                <div className="space-y-4">
                    {/* CMD */}
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('cmd')}
                        </span>
                        <code className="text-sm">
                            {config.cmd?.join(' ') || t('noCmd')}
                        </code>
                    </div>

                    {/* ENTRYPOINT */}
                    <div className="flex items-center gap-4 border-b pb-3">
                        <span className="text-muted-foreground w-32 shrink-0 text-sm font-medium">
                            {t('entrypoint')}
                        </span>
                        <code className="text-sm">
                            {config.entrypoint?.join(' ') || t('noEntrypoint')}
                        </code>
                    </div>

                    {/* ENV as table */}
                    <div className="flex gap-4">
                        <span className="text-muted-foreground w-32 shrink-0 pt-1 text-sm font-medium">
                            {t('env')}
                        </span>
                        {envVars.length ? (
                            <div className="flex-1 overflow-hidden">
                                <table className="w-full">
                                    <tbody>
                                        {envVars.map(({ key, value }) => (
                                            <tr key={key} className="border-b last:border-b-0">
                                                <td className="text-muted-foreground w-48 truncate py-2 pr-4 font-mono text-sm">
                                                    {key}
                                                </td>
                                                <td className="truncate py-2 font-mono text-sm">
                                                    {value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <span className="text-muted-foreground pt-1 text-sm">
                                {t('noEnv')}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
