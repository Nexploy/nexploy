'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Hammer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BuildConfigurationFields } from '@/components/repositories/forms/BuildConfigurationFields';

export function BuildConfigurationStep() {
    const t = useTranslations('repository.steps.buildConfig');

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-2">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Hammer className="text-primary size-5" />
                    </div>
                    <div className="flex flex-col">
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <BuildConfigurationFields />
            </CardContent>
        </Card>
    );
}
