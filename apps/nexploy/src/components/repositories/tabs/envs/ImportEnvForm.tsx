'use client';

import { useRef, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ENV_FILE_MAX_SIZE, isBinaryContent, isEnvFileName, parseEnv, validateEnvVariables } from '@/utils/parseEnv';

const SKIPPED_KEYS_PREVIEW = 3;

interface ImportEnvFormProps {
    onImport: (vars: { key: string; value: string }[]) => void;
}

export function ImportEnvForm({ onImport }: ImportEnvFormProps) {
    const t = useTranslations('repository.settings.envVars');
    const closeDialog = useConfirmationDialogStore((state) => state.closeDialog);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [content, setContent] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const importContent = (raw: string) => {
        if (isBinaryContent(raw)) {
            toast.error(t('importReadError'));
            return;
        }

        const { variables, skipped, duplicateKeys } = validateEnvVariables(parseEnv(raw));

        if (variables.length === 0) {
            toast.error(t('importError'));
            return;
        }

        onImport(variables);
        toast.success(t('importSuccess', { count: variables.length }));
        closeDialog();

        if (skipped.length > 0) {
            toast.warning(t('importSkipped', { count: skipped.length }), {
                description: (
                    <ul className="flex flex-col gap-0.5">
                        {skipped.slice(0, SKIPPED_KEYS_PREVIEW).map(({ key, reason }) => (
                            <li key={`${key}-${reason}`} className="font-mono">
                                {key} — {t(`importSkipReason.${reason}`)}
                            </li>
                        ))}
                    </ul>
                ),
            });
        }
        if (duplicateKeys.length > 0) {
            toast.warning(t('importDuplicates', { count: duplicateKeys.length }), {
                description: duplicateKeys.slice(0, SKIPPED_KEYS_PREVIEW).join(', '),
            });
        }
    };

    const readFile = (file: File) => {
        if (!isEnvFileName(file.name)) {
            toast.error(t('importInvalidFile'), { description: file.name });
            return;
        }
        if (file.size === 0) {
            toast.error(t('importEmptyFile'));
            return;
        }
        if (file.size > ENV_FILE_MAX_SIZE) {
            toast.error(t('importFileTooLarge', { size: ENV_FILE_MAX_SIZE / 1024 / 1024 }));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => toast.error(t('importReadError'));
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                toast.error(t('importReadError'));
                return;
            }
            importContent(result);
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) readFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
    };

    return (
        <div className="flex flex-col gap-4">
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    'flex w-full flex-col items-center gap-1 rounded-md border border-dashed p-6 text-center text-sm transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/50',
                )}
            >
                <FileUp className="size-5" />
                <span>{t('importDropzone')}</span>
                <span className="text-muted-foreground text-xs">{t('importHiddenFilesHint')}</span>
            </button>

            <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">{t('importPasteLabel')}</span>
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('importPastePlaceholder')}
                    className="min-h-32 font-mono text-xs"
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeDialog}>
                    {t('cancel')}
                </Button>
                <Button disabled={!content.trim()} onClick={() => importContent(content)}>
                    {t('importSubmit')}
                </Button>
            </div>

            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>
    );
}
