'use client';

import { useTranslations } from 'next-intl';
import { type NodeType } from '@workspace/typescript-interface/pipeline/node';
import { type Node } from '@xyflow/react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { Button } from '@workspace/ui/components/button';
import { Loader2 } from 'lucide-react';
import { DialogFooter, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Form } from '@workspace/ui/components/form';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveNodeConfigAction } from '@/actions/repository/pipeline/saveNodeConfig.action';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { CONFIG_PANELS, CONFIG_SCHEMAS } from './nodeConfigRegistry';

interface NodeConfigFormProps {
    node: Node;
}

export function NodeConfigForm({ node }: NodeConfigFormProps) {
    const t = useTranslations('repository.pipeline');
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const params = useParams<{ repositoryId: string }>();
    const { handleConfigChange, handlePaneClick } = usePipelineContext();

    const nodeType = node.data.pipelineNodeType as NodeType;
    const nodeConfig = (node.data.config as Record<string, unknown>) ?? {};
    const schema = CONFIG_SCHEMAS[nodeType];
    const ConfigComponent = CONFIG_PANELS[nodeType];

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        saveNodeConfigAction.bind(null, params.repositoryId, node.id),
        zodResolver(schema),
        {
            formProps: {
                defaultValues: { ...(schema.safeParse({}).data ?? {}), ...nodeConfig },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) handleConfigChange(node.id, data as Record<string, unknown>);
                    handlePaneClick();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? tConfig('saveError'));
                },
            },
        },
    );

    if (!ConfigComponent) return null;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="flex max-h-[90vh] flex-col gap-4">
                <DialogHeader>
                    <DialogTitle className="text-sm">
                        {t(`nodes.${nodeType}.name` as never)}
                    </DialogTitle>
                </DialogHeader>

                <ScrollAreaWithShadow bottomShadow className="h-full">
                    <div className="px-6 pb-6">
                        <ConfigComponent />
                    </div>
                </ScrollAreaWithShadow>

                <DialogFooter className="px-6 pb-6">
                    <Button type="button" variant="outline" size="sm" onClick={handlePaneClick}>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!form.formState.isDirty || action.isPending}
                    >
                        {action.isPending && <Loader2 className="animate-spin" />}
                        {tConfig('save')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
