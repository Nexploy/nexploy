'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { CheckCircle, Loader2, Save, Trash2 } from 'lucide-react';
import { usePipelineContext } from '@/contexts/PipelineContext';

interface PipelineToolbarProps {
    onSave: () => void;
    onValidate: () => void;
    isSaving: boolean;
    isValidating: boolean;
}

export function PipelineToolbar({ onSave, onValidate, isSaving, isValidating }: PipelineToolbarProps) {
    const t = useTranslations('repository.pipeline');
    const { selectedNodeIds, handleDeleteSelection } = usePipelineContext();

    return (
        <div className="flex items-center gap-2 border-b px-4 py-2">
            <h2 className="mr-auto text-sm font-medium text-foreground">{t('title')}</h2>

            {selectedNodeIds.length > 1 && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelection}
                    className="h-7 gap-1.5 text-xs"
                >
                    <Trash2 className="size-3" />
                    {t('deleteSelection', { count: selectedNodeIds.length })}
                </Button>
            )}

            <Button
                variant="ghost"
                size="sm"
                onClick={onValidate}
                disabled={isValidating}
                className="h-7 gap-1.5 border border-border bg-card text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
                {isValidating ? (
                    <Loader2 className="size-3 animate-spin" />
                ) : (
                    <CheckCircle className="size-3" />
                )}
                {t('validate')}
            </Button>

            <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="h-7 gap-1.5 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
            >
                {isSaving ? (
                    <Loader2 className="size-3 animate-spin" />
                ) : (
                    <Save className="size-3" />
                )}
                {t('save')}
            </Button>
        </div>
    );
}
