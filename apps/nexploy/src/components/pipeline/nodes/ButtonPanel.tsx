import { Panel } from '@xyflow/react';
import { Plus, Workflow } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { usePipelinePanelStore } from '@/stores/pipeline/usePipelinePanelStore';
import { useTranslations } from 'next-intl';
import { Can } from '@/components/permission/Can';

const panelButtonClassName =
    'size-8 border backdrop-blur-md data-[active=false]:bg-sidebar/85 data-[active=false]:border-border/70 data-[active=false]:hover:bg-sidebar data-[active=true]:border-transparent';

export function ButtonPanel() {
    const { activePanel, togglePanel } = usePipelinePanelStore();
    const t = useTranslations('repository.pipeline');

    return (
        <Can resource="repository" action="update">
            <Panel position="top-right" className="m-2! flex flex-col items-center gap-1.5">
                <Button
                    data-active={activePanel === 'palette'}
                    variant={activePanel === 'palette' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => togglePanel('palette')}
                    className={panelButtonClassName}
                    title={t('nodePalette')}
                >
                    <Plus />
                </Button>

                <Button
                    data-active={activePanel === 'template'}
                    variant={activePanel === 'template' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => togglePanel('template')}
                    className={panelButtonClassName}
                    title={t('pipelineTemplates')}
                >
                    <Workflow />
                </Button>
            </Panel>
        </Can>
    );
}
