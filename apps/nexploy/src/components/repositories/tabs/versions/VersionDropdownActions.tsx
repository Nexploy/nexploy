'use client';

import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { onDeleteVersion } from '@/actions/repository/versions/deleteVersion.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { toast } from 'sonner';
import { Version } from '@workspace/typescript-interface/docker/docker.version';
import { usePermissions } from '@/contexts/PermissionContext';

interface VersionDropdownActionsProps {
    version: Version;
    repositoryId: string;
}

export function VersionDropdownActions({ version, repositoryId }: VersionDropdownActionsProps) {
    const t = useTranslations('repository.versions');
    const tCommon = useTranslations('common');
    const { can } = usePermissions();
    if (!can('build', 'delete')) return null;

    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const { execute } = useAction(onDeleteVersion, {
        onSuccess: () => {
            toast.success(t('deleteSuccess'));
        },
    });

    const handleDelete = () => {
        openAlertDialog({
            title: t('deleteTitle'),
            description: t('confirmDelete'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('delete'),
            onAction: async () =>
                execute({
                    repositoryId,
                    imageTag: version.imageTag,
                }),
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete();
                    }}
                >
                    <Trash2 className="size-4" />
                    {t('delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
