'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteRegistryAction } from '@/actions/registry/deleteRegistry.action';
import { EditRegistryForm } from '@/components/registry/EditRegistryForm';
import type { RegistryListItem } from '@/services/registry.service';
import { DeleteRegistryDescription } from '@/components/registry/DeleteRegistryDescription';
import { Separator } from '@workspace/ui/components/separator';
import { Can } from '@/components/permission/Can';

interface RegistryCardProps {
    registry: RegistryListItem;
}

export function RegistryCard({ registry }: RegistryCardProps) {
    const router = useRouter();
    const t = useTranslations('admin.registry');
    const tCommon = useTranslations('common');
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleDelete = () => {
        const options = { removeContainer: false };

        openAlertDialog({
            title: t('deleteTitle'),
            description: (
                <DeleteRegistryDescription
                    name={registry.name}
                    containerName={registry.containerName}
                    onRemoveContainerChange={(value) => {
                        options.removeContainer = value;
                    }}
                />
            ),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('delete'),
            onAction: async () => {
                const result = await deleteRegistryAction({
                    id: registry.id,
                    removeContainer: options.removeContainer,
                });
                if (!result?.serverError) {
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
        <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{registry.name}</span>
                    <div className="flex items-center gap-1">
                        <p className="text-muted-foreground text-sm">{registry.url}</p>
                        {registry.username && (
                            <>
                                <Separator orientation="vertical" className="h-3!" />
                                <p className="text-muted-foreground text-sm">{registry.username}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Can resource="registry" action="update">
                        <Button variant="outline" size="icon" onClick={handleEdit} icon={Pencil} title={t('edit')} />
                    </Can>
                    <Can resource="registry" action="delete">
                        <Button
                            variant="destructiveOutline"
                            size="icon"
                            onClick={handleDelete}
                            icon={Trash2}
                            title={t('delete')}
                        />
                    </Can>
                </div>
            </div>
        </div>
    );
}
