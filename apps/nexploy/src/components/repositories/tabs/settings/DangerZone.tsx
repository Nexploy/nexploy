'use client';

import { OctagonAlert } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Repository } from 'generated/client';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import { DeleteRepositoryForm } from '@/components/repositories/DeleteRepositoryForm';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore.ts';

interface DangerZoneProps {
    repository: Repository;
}

export function DangerZone({ repository }: DangerZoneProps) {
    const t = useTranslations('repository.settings.dangerZone');
    const { openDialog } = useConfirmationDialogStore();

    const handleOpenDelete = () => {
        openDialog({
            title: t('deleteTitle'),
            description: t('deleteDescription'),
            props: { showCloseButton: false },
            closeOnBackground: false,
            content: (
                <DeleteRepositoryForm
                    repositoryId={repository.id}
                    repositoryName={repository.name}
                />
            ),
        });
    };

    return (
        <Card className="border-destructive">
            <CardHeaderWithIcon
                isDestructive
                icon={OctagonAlert}
                title={t('title')}
                description={t('description')}
            />
            <CardContent>
                <Button variant="destructive" onClick={handleOpenDelete}>
                    {t('deleteButton')}
                </Button>
            </CardContent>
        </Card>
    );
}
