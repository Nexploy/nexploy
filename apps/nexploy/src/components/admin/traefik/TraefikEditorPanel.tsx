'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DiffEditor, Editor } from '@monaco-editor/react';
import { useTheme } from '@wrksz/themes/client';
import { useTraefikConfigStore } from '@/stores/admin/useTraefikConfigStore';
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
    const { theme } = useTheme();
    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs-light';

    const { savedContent, fileContent, isDiffMode, yamlError, contentLoading, setFileContent } =
        useTraefikConfigStore();

    return (
        <div className="flex h-full min-w-0 flex-col">
            <TraefikEditorToolbar />
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
