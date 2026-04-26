import { Panel } from '@xyflow/react';
import { Plus, Workflow } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { usePipelinePanelStore } from '@/stores/usePipelinePanelStore';
import { useTranslations } from 'next-intl';

export function ButtonPanel() {
    const { activePanel, togglePanel } = usePipelinePanelStore();
    const t = useTranslations('repository.pipeline');

    return (
        <Panel position="top-right" className="!m-2 flex flex-col items-center gap-1.5">
            <Button
                variant={activePanel === 'palette' ? 'default' : 'secondary'}
                size="icon"
                onClick={() => togglePanel('palette')}
                className="size-8"
                title={t('nodePalette')}
            >
                <Plus />
            </Button>

            <Button
                variant={activePanel === 'template' ? 'default' : 'secondary'}
                size="icon"
                onClick={() => togglePanel('template')}
                className="size-8"
                title={t('pipelineTemplates')}
            >
                <Workflow />
            </Button>
        </Panel>
    );
}
