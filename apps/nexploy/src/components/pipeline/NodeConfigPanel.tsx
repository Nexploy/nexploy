'use client';

import { useTranslations } from 'next-intl';
import { PipelineNode, NodeType } from '@workspace/typescript-interface/pipeline/node';
import { getNodeDefinition } from '@/lib/pipeline/nodeRegistry';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

interface NodeConfigPanelProps {
    node: PipelineNode;
    onChange: (nodeId: string, config: Record<string, unknown>) => void;
    onClose: () => void;
}

export function NodeConfigPanel({ node, onChange, onClose }: NodeConfigPanelProps) {
    const t = useTranslations('repository.pipeline');
    const def = getNodeDefinition(node.data.type);
    const config = node.data.config;

    const update = (key: string, value: unknown) => {
        onChange(node.id, { ...config, [key]: value });
    };

    if (!def) return null;

    const renderFields = () => {
        switch (node.data.type as NodeType) {
            case 'clone-repository':
                return (
                    <p className="text-muted-foreground text-sm">{t('nodes.clone-repository.noConfig')}</p>
                );

            case 'build-docker-image':
                return (
                    <>
                        <div className="space-y-1.5">
                            <Label>{t('config.dockerfilePath')}</Label>
                            <Input
                                value={(config.dockerfilePath as string) ?? 'Dockerfile'}
                                onChange={(e) => update('dockerfilePath', e.target.value)}
                                placeholder="Dockerfile"
                            />
                        </div>
                    </>
                );

            case 'deploy-container':
                return (
                    <p className="text-muted-foreground text-sm">{t('config.deployContainerInfo')}</p>
                );

            case 'write-env-file':
                return (
                    <div className="flex items-center justify-between">
                        <Label>{t('config.useRepositoryEnvVars')}</Label>
                        <Switch
                            checked={(config.useRepositoryEnvVars as boolean) ?? true}
                            onCheckedChange={(v) => update('useRepositoryEnvVars', v)}
                        />
                    </div>
                );

            case 'run-script':
                return (
                    <>
                        <div className="space-y-1.5">
                            <Label>{t('config.script')}</Label>
                            <Textarea
                                value={(config.script as string) ?? ''}
                                onChange={(e) => update('script', e.target.value)}
                                placeholder="echo hello"
                                rows={5}
                                className="font-mono text-xs"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>{t('config.failOnError')}</Label>
                            <Switch
                                checked={(config.failOnError as boolean) ?? true}
                                onCheckedChange={(v) => update('failOnError', v)}
                            />
                        </div>
                    </>
                );

            case 'send-notification':
                return (
                    <>
                        <div className="space-y-1.5">
                            <Label>{t('config.webhookUrl')}</Label>
                            <Input
                                value={(config.webhookUrl as string) ?? ''}
                                onChange={(e) => update('webhookUrl', e.target.value)}
                                placeholder="https://hooks.example.com/webhook"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('config.message')}</Label>
                            <Input
                                value={(config.message as string) ?? ''}
                                onChange={(e) => update('message', e.target.value || undefined)}
                                placeholder={t('config.messagePlaceholder')}
                            />
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="border-border bg-card flex w-64 shrink-0 flex-col border-l">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-medium">{t(`nodes.${node.data.type as NodeType}.name`)}</h3>
                <Button variant="ghost" size="icon" className="size-6" onClick={onClose}>
                    <X className="size-3.5" />
                </Button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto p-4">{renderFields()}</div>
        </div>
    );
}
