'use client';

import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { onImageUntagAction } from '@/actions/docker/image/imageUntagAction.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import type { Image } from '@workspace/typescript-interface/docker/docker.image';

interface ImageUntagFormProps {
    image: Image;
}

export function ImageUntagForm({ image }: ImageUntagFormProps) {
    const t = useTranslations('docker.imageActions');
    const tCommon = useTranslations('common');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);
    const [selected, setSelected] = useState<string[]>([]);

    const { execute, isPending } = useAction(onImageUntagAction, {
        onSuccess: ({ data }) => {
            if (data?.untagged.length) toast.success(t('untagSuccess', { count: data.untagged.length }));
            closeDialog();
        },
        onError: ({ error }) => {
            if (error.serverError) toast.error(error.serverError);
        },
    });

    const toggle = (repoTag: string, checked: boolean) => {
        setSelected((current) => (checked ? [...current, repoTag] : current.filter((tag) => tag !== repoTag)));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {image.repoTags.map((repoTag) => (
                    <Label
                        key={repoTag}
                        htmlFor={`untag-${repoTag}`}
                        className="bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-mono text-sm"
                    >
                        <Checkbox
                            id={`untag-${repoTag}`}
                            checked={selected.includes(repoTag)}
                            onCheckedChange={(checked) => toggle(repoTag, checked === true)}
                        />
                        {repoTag}
                    </Label>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
                    {tCommon('cancel')}
                </Button>
                <Button
                    type="button"
                    isLoading={isPending}
                    disabled={selected.length === 0 || selected.length >= image.repoTags.length}
                    onClick={() => execute({ tags: selected })}
                >
                    {t('untag')}
                </Button>
            </div>
        </div>
    );
}
