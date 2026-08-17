'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ActivityExportForm } from '@/components/admin/activity/ActivityExportForm';

export function ActivityExportDialog() {
    const t = useTranslations('admin.activity');
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const handleExport = () => {
        openDialog({
            title: t('export.title'),
            description: t('export.description'),
            props: { className: 'sm:max-w-lg' },
            content: <ActivityExportForm />,
            onSuccess: () => closeDialog(),
        });
    };

    return (
        <Button className="mt-5" onClick={handleExport}>
            <Download className="size-4" />
            {t('export.trigger')}
        </Button>
    );
}
