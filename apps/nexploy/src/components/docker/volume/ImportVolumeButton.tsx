'use client';

import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ImportVolumeForm } from '@/components/docker/volume/ImportVolumeForm';

interface ImportVolumeButtonProps {
    disabled?: boolean;
}

export function ImportVolumeButton({ disabled }: ImportVolumeButtonProps) {
    const t = useTranslations('docker.importVolumePage');
    const { openDialog } = useConfirmationDialogStore();

    const handleClick = () => {
        openDialog({
            title: t('title'),
            description: t('description'),
            props: { className: 'sm:max-w-[480px]' },
            content: <ImportVolumeForm />,
        });
    };

    return (
        <Button variant="outline" onClick={handleClick} icon={Upload} disabled={disabled}>
            {t('title')}
        </Button>
    );
}
