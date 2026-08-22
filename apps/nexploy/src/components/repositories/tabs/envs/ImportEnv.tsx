'use client';

import { Button } from '@workspace/ui/components/button';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ImportEnvForm } from './ImportEnvForm';

interface ImportEnvProps {
    onImport: (vars: { key: string; value: string }[]) => void;
}

export function ImportEnv({ onImport }: ImportEnvProps) {
    const t = useTranslations('repository.settings.envVars');
    const openDialog = useConfirmationDialogStore((state) => state.openDialog);

    const handleOpen = () => {
        openDialog({
            title: t('importTitle'),
            description: t('importDescription'),
            content: <ImportEnvForm onImport={onImport} />,
        });
    };

    return (
        <Button variant="outline" size="xs" icon={Upload} onClick={handleOpen}>
            {t('importEnv')}
        </Button>
    );
}
