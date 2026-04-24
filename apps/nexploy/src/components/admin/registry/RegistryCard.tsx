'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@workspace/ui/components/accordion';
import { LayoutList, Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteRegistryAction } from '@/actions/registry/deleteRegistry.action';
import { EditRegistryForm } from '@/components/admin/registry/EditRegistryForm';
import type { RegistryInfo } from '@/services/registry.service';
import type { RegistryImage } from '@/app/api/registry/[id]/images/route';
import { Separator } from '@workspace/ui/components/separator';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface RegistryCardProps {
    registry: RegistryInfo;
}

export function RegistryCard({ registry }: RegistryCardProps) {
    const router = useRouter();
    const t = useTranslations('admin.registry');
    const tCommon = useTranslations('common');
    const { openDialog, closeDialog } = useConfirmationDialogStore();
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const {
        data: images,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useSWR<RegistryImage[]>(
        { url: `/api/registry/${registry.id}/images`, disableToast: true },
        fetcherApi,
        {
            errorRetryCount: 0,
        },
    );

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

            <Accordion type="single" collapsible defaultValue="images">
                <AccordionItem value="images" className="border-t border-b-0">
                    <AccordionTrigger
                        className="px-4 hover:no-underline"
                        headerChildren={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="mr-2 size-7 shrink-0"
                                title={t('refreshImages')}
                                disabled={isValidating}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    mutate();
                                }}
                            >
                                <RefreshCw
                                    className={`size-3.5 ${isValidating ? 'animate-spin' : ''}`}
                                />
                            </Button>
                        }
                    >
                        <div className="flex items-center gap-2">
                            <LayoutList className="text-muted-foreground size-4" />
                            <span className="text-sm font-medium">{t('images')}</span>
                            {images && (
                                <Badge variant="secondary" className="text-xs">
                                    {images.length}
                                </Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-0 pb-4">
                        {isLoading && (
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Loader2 className="size-4 animate-spin" />
                                {t('imagesLoading')}
                            </div>
                        )}
                        {error && <p className="text-destructive text-sm">{t('imagesError')}</p>}
                        {images && images.length === 0 && (
                            <p className="text-muted-foreground text-sm">{t('imagesEmpty')}</p>
                        )}
                        {images && images.length > 0 && (
                            <div className="flex flex-col gap-3">
                                {images.map((image) => (
                                    <div key={image.name} className="flex flex-col gap-1.5">
                                        <span className="font-mono text-sm font-medium">
                                            {image.name}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {image.tags.length === 0 ? (
                                                <span className="text-muted-foreground text-xs">
                                                    —
                                                </span>
                                            ) : (
                                                image.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="font-mono text-xs"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
