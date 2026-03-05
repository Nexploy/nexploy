'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { Save, CheckCircle, Play, Loader2 } from 'lucide-react';

interface PipelineToolbarProps {
    onSave: () => void;
    onValidate: () => void;
    isSaving: boolean;
    isValidating: boolean;
}

export function PipelineToolbar({ onSave, onValidate, isSaving, isValidating }: PipelineToolbarProps) {
    const t = useTranslations('repository.pipeline');

    return (
        <div className="border-border bg-card flex items-center gap-2 border-b px-4 py-2">
            <h2 className="mr-auto text-sm font-medium">{t('title')}</h2>
            <Button
                variant="outline"
                size="sm"
                onClick={onValidate}
                disabled={isValidating}
            >
                {isValidating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <CheckCircle className="size-3.5" />
                )}
                {t('validate')}
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
                {isSaving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <Save className="size-3.5" />
                )}
                {t('save')}
            </Button>
        </div>
    );
}
