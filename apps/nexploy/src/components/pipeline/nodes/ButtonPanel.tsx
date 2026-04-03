import { FlaskConical, Plus, Workflow } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { usePipelinePanelStore } from '@/stores/usePipelinePanelStore';

const isDev = process.env.NODE_ENV !== 'production';

export function ButtonPanel() {
    const { activePanel, togglePanel } = usePipelinePanelStore();

    return (
        <div className="absolute top-2 right-2 z-10 flex flex-col items-center gap-1.5">
            <Button
                variant={activePanel === 'palette' ? 'default' : 'secondary'}
                size="icon"
                onClick={() => togglePanel('palette')}
                className="size-8"
                title="Node palette"
            >
                <Plus />
            </Button>

            <Button
                variant={activePanel === 'template' ? 'default' : 'secondary'}
                size="icon"
                onClick={() => togglePanel('template')}
                className="size-8"
                title="Templates"
            >
                <Workflow />
            </Button>

            {isDev && (
                <Button
                    variant={activePanel === 'test' ? 'default' : 'secondary'}
                    size="icon"
                    onClick={() => togglePanel('test')}
                    className="size-8 text-orange-500"
                    title="Test panel (dev only)"
                >
                    <FlaskConical />
                </Button>
            )}
        </div>
    );
}
