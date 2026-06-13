import { Panel } from '@xyflow/react';
import { Plus, Workflow } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/PermissionContext';

export function ButtonPanel() {
    const { activePanel, togglePanel } = usePipelinePanelStore();
    const t = useTranslations('repository.pipeline');
    const { can } = usePermissions();

    if (!can('repository', 'update')) return null;

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
