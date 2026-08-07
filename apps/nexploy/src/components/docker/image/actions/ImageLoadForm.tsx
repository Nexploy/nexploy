'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { ProtectedAction } from '@/components/permission/ProtectedAction';
import { DragAndDrop } from '@workspace/ui/components/drag-and-drop';
import { onImageLoadAction } from '@/actions/docker/image/imageLoadAction.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

export function ImageLoadForm() {
    const t = useTranslations('docker.imageActions');
    const tCommon = useTranslations('common');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);
    const [archive, setArchive] = useState<File | null>(null);

    const { execute, isPending } = useAction(onImageLoadAction, {
        onSuccess: ({ data }) => {
            toast.success(t('loadSuccess', { count: data?.loaded.length ?? 0 }));
            closeDialog();
        },
        onError: ({ error }) => {
            if (error.serverError) toast.error(error.serverError);
        },
    });

    return (
        <div className="space-y-4">
            <DragAndDrop
                onFile={setArchive}
                accept={['.tar', '.tar.gz', '.tgz']}
                dropText={t('archiveDropZone')}
                formatsText={t('archiveFormats')}
                disabled={isPending}
            />

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                    {tCommon('cancel')}
                </Button>
                <ProtectedAction action="image.pull">
                    <Button
                        type="button"
                        isLoading={isPending}
                        disabled={!archive}
                        onClick={() => archive && execute({ archive })}
                    >
                        {t('load')}
                    </Button>
                </ProtectedAction>
            </div>
        </div>
    );
}
