'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteRegistryAction } from '@/actions/registry/deleteRegistry.action';
import { EditRegistryForm } from '@/components/admin/registry/EditRegistryForm';
import type { RegistryInfo } from '@/services/registry.service';
import { Separator } from '@workspace/ui/components/separator';

interface RegistryCardProps {
    registry: RegistryInfo;
}

export function RegistryCard({ registry }: RegistryCardProps) {
    const router = useRouter();
    const t = useTranslations('admin.registry');
    const tCommon = useTranslations('common');
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleDelete = () => {
        openAlertDialog({
            title: t('deleteTitle'),
            description: t('deleteDescription', { name: registry.name }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('delete'),
            onAction: async () => {
                const result = await deleteRegistryAction({ id: registry.id });
                if (result?.serverError) {
                    toast.error(result.serverError);
                } else {
                    toast.success(t('deleteSuccess'));
                    router.refresh();
                }
            },
        });
    };

    const handleEdit = () => {
        openDialog({
            title: t('editTitle'),
            description: t('editDescription'),
            content: <EditRegistryForm registry={registry} />,
            onSuccess: () => {
                toast.success(t('updateSuccess'));
                closeDialog();
                router.refresh();
            },
        });
    };

    return (
        <div className="bg-card rounded-xl border shadow-sm">
            <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{registry.name}</span>
                    <div className="flex items-center gap-1">
                        <p className="text-muted-foreground text-sm">{registry.url}</p>
                        {registry.username && (
                            <>
                                <Separator orientation="vertical" className="!h-3" />
                                <p className="text-muted-foreground text-sm">{registry.username}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleEdit}
                        icon={Pencil}
                        title={t('edit')}
                    />
                    <Button
                        variant="destructiveOutline"
                        size="icon"
                        onClick={handleDelete}
                        icon={Trash2}
                        title={t('delete')}
                    />
                </div>
            </div>
        </div>
    );
}
