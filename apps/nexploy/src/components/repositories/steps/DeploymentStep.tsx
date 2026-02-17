'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DeploymentFields } from '@/components/repositories/forms/DeploymentFields';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

export function DeploymentStep() {
    const t = useTranslations('repository.steps.deployment');

    return (
        <Card>
            <CardHeaderWithIcon icon={Rocket} title={t('title')} description={t('description')} />
            <CardContent className="space-y-4">
                <DeploymentFields />
            </CardContent>
        </Card>
    );
}
