'use client';

import { useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { parseEnv } from '@/utils/parseEnv';

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
            const parsed = parseEnv(content);
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
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
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
