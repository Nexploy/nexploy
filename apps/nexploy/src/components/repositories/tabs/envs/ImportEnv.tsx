'use client';

import { useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

function parseEnvFile(content: string): { key: string; value: string }[] {
    return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .reduce<{ key: string; value: string }[]>((acc, line) => {
            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) return acc;
            const key = line.substring(0, eqIndex).trim();
            let value = line.substring(eqIndex + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            if (key) acc.push({ key, value });
            return acc;
        }, []);
}

interface ImportEnvProps {
    onImport: (vars: { key: string; value: string }[]) => void;
}

export function ImportEnv({ onImport }: ImportEnvProps) {
    const t = useTranslations('repository.settings.envVars');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const parsed = parseEnvFile(content);
            if (parsed.length === 0) {
                toast.error(t('importError'));
                return;
            }
            onImport(parsed);
            toast.success(t('importSuccess', { count: parsed.length }));
        };
        reader.readAsText(file);
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload />
                {t('importEnv')}
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".env,.txt,text/plain"
                className="hidden"
                onChange={handleFileChange}
            />
        </>
    );
}
