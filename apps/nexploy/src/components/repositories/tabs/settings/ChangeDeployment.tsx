'use client';

import { Card, CardContent } from '@workspace/ui/components/card';
import { Rocket } from 'lucide-react';
import { Environment, Repository } from 'generated/client';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { EnvironmentSelector } from './EnvironmentSelector';
import { AutoDeployToggle } from './AutoDeployToggle';

interface ChangeDeploymentProps {
    repository: Repository & { environment?: Environment | null };
}

export function ChangeDeployment({ repository }: ChangeDeploymentProps) {
    return (
        <Card>
            <CardHeaderWithIcon
                icon={Rocket}
                title={'Déploiement'}
                description={'Paramètres de déploiement'}
            />
            <CardContent className="space-y-4">
                <EnvironmentSelector repository={repository} />
                <AutoDeployToggle repository={repository} />
            </CardContent>
        </Card>
    );
}
