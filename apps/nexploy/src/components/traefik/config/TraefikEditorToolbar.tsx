'use client';

import { useTranslations } from 'next-intl';
import { Check, FileCode2, GitCompare, Loader2, Trash2, WandSparkles } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useTraefikConfigStore } from '@/stores/traefik/useTraefikConfigStore';
import { cn } from '@workspace/ui/lib/utils';
import { Separator } from '@workspace/ui/components/separator.tsx';

export function TraefikEditorToolbar() {
    const t = useTranslations('admin.traefik');

    const { selectedFile, fileContent, isSaving, isDiffMode, yamlError, formatContent, toggleDiffMode, deleteFile } =
        useTraefikConfigStore();

    const isYaml = !!selectedFile && selectedFile.endsWith('.yml');

    return (
        <div className="flex h-9 items-center justify-between gap-2 border-border border-b px-3">
            <div className="flex min-w-0 items-center gap-2">
                <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate font-medium text-sm">{selectedFile}</span>
                <Separator orientation={'vertical'} className={'h-3! w-1'} />
                <div
                    className={cn(
                        'flex items-center gap-1.5 text-muted-foreground text-xs transition-opacity duration-300',
                        isSaving ? 'opacity-100' : 'opacity-40',
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="size-3 animate-spin" />
                            {t('saving')}
                        </>
                    ) : (
                        <>
                            <Check className="size-3" />
                            {t('saved')}
                        </>
                    )}
                </div>
                {yamlError && (
                    <>
                        <Separator orientation={'vertical'} className={'h-3! w-1'} />
                        <Badge variant="destructive" className="shrink-0 text-xs">
                            {t('yamlInvalid')}
                        </Badge>
                    </>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => formatContent(t)}
                            disabled={!isYaml || !!yamlError || !fileContent.trim()}
                        >
                            <WandSparkles className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('format')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isDiffMode ? 'secondary' : 'ghost'}
                            size="icon"
                            className="size-7"
                            onClick={toggleDiffMode}
                        >
                            <GitCompare className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isDiffMode ? t('editorView') : t('diffView')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteFile(t)}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('delete')}</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
