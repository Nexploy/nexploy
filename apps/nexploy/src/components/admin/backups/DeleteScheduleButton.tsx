'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { deleteBackupScheduleAction } from '@/actions/aws/deleteSchedule.action';

interface DeleteScheduleButtonProps {
    scheduleId: string;
}

export function DeleteScheduleButton({ scheduleId }: DeleteScheduleButtonProps) {
    const t = useTranslations('admin');

    const handleDelete = async () => {
        const result = await deleteBackupScheduleAction({ id: scheduleId });
        if (result?.serverError) {
            toast.error(result.serverError);
            return;
        }
        toast.success(t('scheduleDeletedSuccess'));
    };

    return (
        <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="text-destructive size-4" />
        </Button>
    );
}
