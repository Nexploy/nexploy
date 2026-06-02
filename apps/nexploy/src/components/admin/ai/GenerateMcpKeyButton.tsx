'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { CreateMcpKeyForm } from '@/components/admin/ai/CreateMcpKeyForm';

export function GenerateMcpKeyButton() {
    const t = useTranslations('ai.admin.mcp');
    const { openDialog } = useConfirmationDialogStore();

    function handleOpen() {
        openDialog({
            title: t('generateKey'),
            content: <CreateMcpKeyForm />,
        });
    }

    return (
        <Button size={'sm'} icon={Plus} onClick={handleOpen}>
            {t('generateKey')}
        </Button>
    );
}
