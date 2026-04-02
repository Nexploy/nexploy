'use client';

import { type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { type NodeId } from '@workspace/typescript-interface/pipeline/node';
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
import { CONFIG_PANELS, CONFIG_SCHEMAS, HAS_CONFIG_SCHEMA } from './nodeConfigRegistry';
import { cn } from '@workspace/ui/lib/utils';

interface NodeConfigFormProps {
    node: Node;
}

export function NodeConfigForm({ node }: NodeConfigFormProps) {
    const t = useTranslations('repository.pipeline');
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const params = useParams<{ repositoryId: string }>();
    const { handleConfigChange, handleResetPanelNode, isViewingBuild } = usePipelineContext();

    const nodeType = node.data.nodeType as NodeId;
    const nodeConfig = node.data.config ?? {};
    const schema = CONFIG_SCHEMAS[nodeType];
    const ConfigComponent = CONFIG_PANELS[nodeType];
    const hasSchema = HAS_CONFIG_SCHEMA[nodeType];

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        saveNodeConfigAction.bind(null, params.repositoryId, node.id),
        zodResolver(schema),
        {
            formProps: {
                defaultValues: { ...(schema.safeParse({}).data ?? {}), ...nodeConfig },
            },
            actionProps: {
                onSuccess: ({ data: config }) => {
                    if (config) handleConfigChange(node.id, config);
                    handleResetPanelNode();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? tConfig('saveError'));
                },
            },
        },
    );

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        handleSubmitWithAction(e);
    };

    if (!ConfigComponent) return null;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col gap-4">
                {!isViewingBuild && (
                    <DialogHeader>
                        <DialogTitle className="text-sm">{t(`nodes.${nodeType}.name`)}</DialogTitle>
                    </DialogHeader>
                )}

                <ScrollAreaWithShadow bottomShadow className="h-full">
                    <div className={cn('px-6 pb-6', isViewingBuild && 'px-4 pb-4')}>
                        <fieldset
                            disabled={isViewingBuild}
                            className={cn(isViewingBuild && 'pointer-events-none')}
                        >
                            <ConfigComponent />
                        </fieldset>
                    </div>
                </ScrollAreaWithShadow>

                <DialogFooter className={cn('px-6 pb-6', isViewingBuild && 'px-4 pb-4')}>
                    {!isViewingBuild && hasSchema && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetPanelNode}
                            >
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
                        </>
                    )}
                </DialogFooter>
            </form>
        </Form>
    );
}
