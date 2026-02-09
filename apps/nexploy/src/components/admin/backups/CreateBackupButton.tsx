'use client';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CreateBackupDialog } from '@/components/admin/backups/CreateBackupDialog';

export function CreateBackupButton() {
    const t = useTranslations('admin');
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                {t('createBackup')}
            </Button>
            <CreateBackupDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
