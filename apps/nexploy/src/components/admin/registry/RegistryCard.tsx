'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ChevronUp, Download, Images, Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { deleteRegistryAction } from '@/actions/registry/deleteRegistry.action';
import { setDefaultRegistryAction } from '@/actions/registry/setDefaultRegistry.action';
import { EditRegistryForm } from '@/components/admin/registry/EditRegistryForm';
import type { RegistryInfo } from '@/services/registry.service';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { Separator } from '@workspace/ui/components/separator';

interface RegistryImage {
    name: string;
    tags: string[];
}

interface RegistryCardProps {
    registry: RegistryInfo;
}

export function RegistryCard({ registry }: RegistryCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSettingDefault, setIsSettingDefault] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();
    const t = useTranslations('admin.registry');
    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const { data, isLoading: isLoadingImages } = useSWR<{ images: RegistryImage[] }>(
        isExpanded ? `/api/registry/${registry.id}/images` : null,
        fetcherApi,
        {
            onError: (e) => {
                toast.error(e.message || t('imagesLoadFailed'));
                setIsExpanded(false);
            },
        },
    );

    const images = data?.images ?? null;
    const totalTags = images?.reduce((sum, img) => sum + img.tags.length, 0) ?? 0;

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
        <div className="bg-card rounded-lg border">
            <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{registry.name}</span>
                        {registry.isDefault && (
                            <Badge variant="default" className="text-xs">
                                {t('default')}
                            </Badge>
                        )}
                    </div>
                    <div className={'flex items-center gap-1'}>
                        <p className="text-muted-foreground text-sm">{registry.url}</p>
                        <Separator orientation="vertical" className="!h-3" />
                        {registry.username && (
                            <p className="text-muted-foreground text-sm">{registry.username}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded((v) => !v)}
                        disabled={isLoadingImages}
                        isLoading={isLoadingImages}
                        icon={isExpanded ? ChevronUp : Images}
                        className="gap-1.5"
                    >
                        {isExpanded ? t('hideImages') : t('browseImages')}
                        {images !== null && !isExpanded && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {totalTags}
                            </Badge>
                        )}
                    </Button>
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

            {isExpanded && images !== null && (
                <div className="border-t px-4 pt-3 pb-4">
                    {images.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('noImages')}</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {images.map((img) => (
                                <div key={img.name} className="flex items-start gap-3">
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {img.name}
                                    </span>
                                    <div className="flex flex-wrap justify-end gap-1">
                                        {img.tags.map((tag) => (
                                            <Link
                                                key={tag}
                                                href={`/docker/images/pull?imageName=${encodeURIComponent(`${registry.url}/${img.name}:${tag}`)}`}
                                                title={t('pullImage')}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="hover:bg-accent cursor-pointer gap-1 font-mono text-xs transition-colors"
                                                >
                                                    <Download className="size-3" />
                                                    {tag}
                                                </Badge>
                                            </Link>
                                        ))}
                                        {img.tags.length === 0 && (
                                            <span className="text-muted-foreground text-xs">
                                                {t('noTags')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
