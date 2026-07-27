'use client';

import { useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
    ENV_FILE_MAX_SIZE,
    isBinaryContent,
    isEnvFileName,
    parseEnv,
    validateEnvVariables,
} from '@/utils/parseEnv';

const SKIPPED_KEYS_PREVIEW = 3;

interface ImportEnvProps {
    onImport: (vars: { key: string; value: string }[]) => void;
}

export function ImportEnv({ onImport }: ImportEnvProps) {
    const t = useTranslations('repository.settings.envVars');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

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
            const content = event.target?.result;
            if (typeof content !== 'string' || isBinaryContent(content)) {
                toast.error(t('importReadError'));
                return;
            }

            const { variables, skipped, duplicateKeys } = validateEnvVariables(parseEnv(content));

            if (variables.length === 0) {
                toast.error(t('importError'));
                return;
            }

            onImport(variables);
            toast.success(t('importSuccess', { count: variables.length }));

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

        reader.readAsText(file);
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
            >
                {t('importEnv')}
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        </>
    );
}
