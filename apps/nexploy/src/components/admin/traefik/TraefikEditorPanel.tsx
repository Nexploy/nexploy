'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Check, FileCode2, GitCompare, Loader2, Trash2, WandSparkles, } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { useTheme } from '@wrksz/themes/client';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
import { cn } from '@workspace/ui/lib/utils.ts';

const EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    tabSize: 2,
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    padding: { top: 12, bottom: 12 },
    automaticLayout: true,
};

export function TraefikEditorPanel() {
    const t = useTranslations('admin.traefik');
    const { theme } = useTheme();
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs-light';

    const {
        selectedFile,
        fileContent,
        savedContent,
        isSaving,
        isDiffMode,
        yamlError,
        contentLoading,
        setFileContent,
        formatContent,
        toggleDiffMode,
        deleteFile,
    } = useTraefikConfigStore();

    return (
        <div className="flex h-full min-w-0 flex-col">
            <div className="border-border flex h-9 items-center justify-between gap-2 border-b px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <FileCode2 className="text-muted-foreground size-4 shrink-0" />
                    <span className="min-w-0 truncate text-sm font-medium">{selectedFile}</span>
                    {selectedFile && (
                        <div
                            className={cn(
                                'text-muted-foreground flex items-center gap-1.5 text-xs transition-opacity duration-300',
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
                    )}
                    {yamlError && (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                            {t('yamlInvalid')}
                        </Badge>
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
                                disabled={!!yamlError || !fileContent.trim()}
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
                        <TooltipContent>
                            {isDiffMode ? t('editorView') : t('diffView')}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 size-7"
                                onClick={() => deleteFile(t)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('delete')}</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {yamlError && (
                <div className="border-destructive/20 bg-destructive/10 flex items-center gap-2 border-b px-4 py-2">
                    <AlertTriangle className="text-destructive size-3.5 shrink-0" />
                    <div className="min-w-0">
                        <span className="text-destructive text-xs font-semibold">
                            {t('yamlError')}:{' '}
                        </span>
                        <span className="text-destructive/80 text-xs break-all">{yamlError}</span>
                    </div>
                </div>
            )}

            {contentLoading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="text-muted-foreground size-5 animate-spin" />
                </div>
            ) : isDiffMode ? (
                <div className="flex-1 overflow-hidden">
                    <DiffEditor
                        original={savedContent}
                        modified={fileContent}
                        language="yaml"
                        height="100%"
                        theme={monacoTheme}
                        onMount={(editor) => {
                            editor.getModifiedEditor().onDidChangeModelContent(() => {
                                setFileContent(editor.getModifiedEditor().getValue());
                            });
                        }}
                        options={{
                            ...EDITOR_OPTIONS,
                            renderSideBySide: true,
                            originalEditable: false,
                        }}
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <Editor
                        height="100%"
                        language="yaml"
                        value={fileContent}
                        onChange={(v) => setFileContent(v ?? '')}
                        options={EDITOR_OPTIONS}
                        theme={monacoTheme}
                    />
                </div>
            )}
        </div>
    );
}
