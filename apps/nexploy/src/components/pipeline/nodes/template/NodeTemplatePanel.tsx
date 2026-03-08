'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { usePipelinePanelStore } from '@/stores/usePipelinePanelStore';
import { PIPELINE_TEMPLATES } from './pipelineTemplates';
import { TemplateItem } from '@/components/pipeline/nodes/template/TemplateItem';

export function NodeTemplatePanel() {
    const t = useTranslations('repository.pipeline');
    const { activePanel } = usePipelinePanelStore();
    const open = activePanel === 'template';

    return (
        <div
            className={cn(
                'bg-sidebar flex shrink-0 flex-col overflow-hidden transition-all duration-200',
                open ? 'w-[20%] border-l' : 'w-0',
            )}
        >
            <span className="border-b p-3 text-[10px] font-semibold tracking-widest uppercase">
                {t('templates.title')}
            </span>

            <div className="flex flex-1 flex-col gap-1.5 p-2">
                {PIPELINE_TEMPLATES.map((template) => (
                    <TemplateItem key={template.id} template={template} />
                ))}
            </div>
        </div>
    );
}
