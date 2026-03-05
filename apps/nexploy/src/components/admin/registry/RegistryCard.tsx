'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { deleteRegistryAction } from '@/actions/registry/deleteRegistry.action';
import { setDefaultRegistryAction } from '@/actions/registry/setDefaultRegistry.action';
import { EditRegistryForm } from '@/components/admin/registry/EditRegistryForm';
import type { RegistryInfo } from '@/services/registry.service';

interface RegistryCardProps {
    registry: RegistryInfo;
}

export function RegistryCard({ registry }: RegistryCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSettingDefault, setIsSettingDefault] = useState(false);
    const router = useRouter();
    const t = useTranslations('admin.registry');
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const handleSetDefault = async () => {
        setIsSettingDefault(true);
        try {
            const result = await setDefaultRegistryAction({ id: registry.id });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(t('setDefaultSuccess'));
                router.refresh();
            }
        } catch {
            toast.error(t('setDefaultFailed'));
        } finally {
            setIsSettingDefault(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteRegistryAction({ id: registry.id });
            if (result?.serverError) {
                toast.error(result.serverError);
            } else {
                toast.success(t('deleteSuccess'));
                router.refresh();
            }
        } catch {
            toast.error(t('deleteFailed'));
        } finally {
            setIsDeleting(false);
        }
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
        <div className="bg-card flex items-center justify-between rounded-lg border p-4">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{registry.name}</span>
                    {registry.isDefault && (
                        <Badge variant="default" className="text-xs">
                            {t('default')}
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground text-sm">{registry.url}</p>
                {registry.username && (
                    <p className="text-muted-foreground text-xs">{registry.username}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {!registry.isDefault && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSetDefault}
                        disabled={isSettingDefault}
                        isLoading={isSettingDefault}
                        icon={Star}
                        title={t('setDefault')}
                    />
                )}
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
                    disabled={isDeleting}
                    isLoading={isDeleting}
                    icon={Trash2}
                    title={t('delete')}
                />
            </div>
        </div>
    );
}
