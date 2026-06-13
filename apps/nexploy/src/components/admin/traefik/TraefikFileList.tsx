'use client';

import { useTranslations } from 'next-intl';
import { FileCode2, Trash2 } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { cn } from '@workspace/ui/lib/utils';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';

export function TraefikFileList() {
    const t = useTranslations('admin.traefik');
    const { files, filesLoading, selectedFile, isDirty, selectFile, deleteFile } =
        useTraefikConfigStore();

    return (
        <div className="border-border flex w-[20%] min-w-[150px] shrink-0 flex-col border-r">
            <div className="border-border flex h-9 items-center justify-between border-b px-3">
                <span className="text-muted-foreground text-xs">{t('files')}</span>
            </div>
            <ScrollAreaWithShadow className="flex-1">
                <div className="p-1.5">
                    {filesLoading ? (
                        <div className="space-y-1 p-1">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-6 w-full" />
                            ))}
                        </div>
                    ) : files.length === 0 ? (
                        <p className="text-muted-foreground px-2 py-4 text-center text-xs">
                            {t('noFiles')}
                        </p>
                    ) : (
                        <div className={'flex flex-col gap-1'}>
                            {files.map((file) => (
                                <div
                                    key={file.name}
                                    className={cn(
                                        'group flex w-full items-center gap-1.5 rounded-md p-2 transition-colors',
                                        selectedFile === file.name
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-foreground hover:bg-muted',
                                    )}
                                >
                                    <button
                                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                        onClick={() => selectFile(file.name, t)}
                                    >
                                        <FileCode2 className="size-3.5 shrink-0 opacity-70" />
                                        <span className="min-w-0 flex-1 truncate text-xs">
                                            {file.name}
                                        </span>
                                        {selectedFile === file.name && isDirty() && (
                                            <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteFile(t, file.name);
                                        }}
                                        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                                        title={t('delete')}
                                    >
                                        <Trash2 className="size-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
