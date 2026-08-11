'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { CreateBuildRunnerForm } from '@/components/admin/servers/CreateBuildRunnerForm';
import { Can } from '@/components/permission/Can';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface AddBuildRunnerButtonProps {
    serverUrl: string;
}

export function AddBuildRunnerButton({ serverUrl }: AddBuildRunnerButtonProps) {
    const t = useTranslations('admin.buildRunners');
    const { openDialog } = useConfirmationDialogStore();

    const handleAdd = () => {
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <CreateBuildRunnerForm serverUrl={serverUrl} />,
        });
    };

    return (
        <Can resource="buildRunner" action="create">
            <Button className={'mt-5'} icon={Plus} onClick={handleAdd}>
                {t('add')}
            </Button>
        </Can>
    );
}
