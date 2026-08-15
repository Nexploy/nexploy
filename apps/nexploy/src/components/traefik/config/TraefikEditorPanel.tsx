'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { useTheme } from '@wrksz/themes/client';
import { useTraefikConfigStore } from '@/stores/traefik/useTraefikConfigStore';
import { TraefikEditorToolbar } from './TraefikEditorToolbar';

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
    const { resolvedTheme } = useTheme();
    const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light';

    const { savedContent, fileContent, isDiffMode, yamlError, contentLoading, selectedFile, setFileContent } =
        useTraefikConfigStore();

    const language = selectedFile?.endsWith('.html') ? 'html' : 'yaml';

    return (
        <div className="flex h-full min-w-0 flex-col">
            <TraefikEditorToolbar />
            {yamlError && (
                <div className="flex items-center gap-2 border-destructive/20 border-b bg-destructive/10 px-4 py-2">
                    <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                    <div className="min-w-0">
                        <span className="font-semibold text-destructive text-xs">{t('yamlError')}: </span>
                        <span className="break-all text-destructive/80 text-xs">{yamlError}</span>
                    </div>
                </div>
            )}

            {contentLoading || !resolvedTheme ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
            ) : isDiffMode ? (
                <div className="flex-1 overflow-hidden">
                    <DiffEditor
                        original={savedContent}
                        modified={fileContent}
                        language={language}
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
                        language={language}
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
