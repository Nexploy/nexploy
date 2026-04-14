'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { Plus, Trash2 } from 'lucide-react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { findAncestor } from '@/inngest/pipeline/utils/graphQueries';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { useMemo } from 'react';
import { RefAwareInput } from '@/components/pipeline/nodes/nodeConfigPanel/RefAwareInput';

export function CreateContainerConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tDocker = useTranslations('docker.createContainer');
    const form = useFormContext();

    const { nodes, edges } = usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const environmentId = useMemo(() => {
        if (!panelNodeId) return null;
        const ancestor = findAncestor(
            panelNodeId,
            nodes,
            edges,
            (data) => data.nodeType === 'set-environment' && !data.disabled,
        );
        return ancestor?.data.config?.environmentId ?? null;
    }, []);

    const { images, isLoading } = useEnvironmentImages(environmentId);

    const imageOptions = useMemo(() => {
        const tags = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag !== '<none>:<none>') tags.add(repoTag);
            }
        }
        return Array.from(tags)
            .sort()
            .map((tag) => ({ value: tag, label: tag }));
    }, [images]);

    const advanced = form.watch('advanced');

    const {
        fields: portFields,
        append: appendPort,
        remove: removePort,
    } = useFieldArray({ control: form.control, name: 'ports' });

    const {
        fields: envFields,
        append: appendEnv,
        remove: removeEnv,
    } = useFieldArray({ control: form.control, name: 'envVars' });

    const {
        fields: volumeFields,
        append: appendVolume,
        remove: removeVolume,
    } = useFieldArray({ control: form.control, name: 'volumes' });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
                <Label className="text-muted-foreground text-xs">
                    {advanced ? t('createContainerAdvanced') : t('createContainerSimple')}
                </Label>
                <FormField
                    control={form.control}
                    name="advanced"
                    render={({ field }) => (
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="containerName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerName')}</FormLabel>
                        <FormControl>
                            <RefAwareInput
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('createContainerNamePlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="imageName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerImage')}</FormLabel>
                        <FormControl>
                            <InputAutoComplete
                                className="truncate"
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                options={imageOptions}
                                isLoading={isLoading}
                                placeholder={t('createContainerImagePlaceholder')}
                                heading={t('availableImages')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="restartPolicy"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerRestartPolicy')}</FormLabel>
                        <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>
                                            {t('createContainerRestartPolicy')}
                                        </SelectLabel>
                                        <SelectItem value="unless-stopped">
                                            unless-stopped
                                        </SelectItem>
                                        <SelectItem value="always">always</SelectItem>
                                        <SelectItem value="on-failure">on-failure</SelectItem>
                                        <SelectItem value="no">no</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="networkName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerNetwork')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder={t('createContainerNetworkPlaceholder')}
                            />
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            {advanced && (
                <>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>{tDocker('ports')}</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                    appendPort({ hostPort: '', containerPort: '', protocol: 'tcp' })
                                }
                            >
                                <Plus className="size-3" />
                                {tDocker('addPort')}
                            </Button>
                        </div>
                        {portFields.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                {tDocker('noPortsConfigured')}
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {portFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-1.5">
                                        <FormField
                                            control={form.control}
                                            name={`ports.${index}.hostPort`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={tDocker('hostPort')}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-muted-foreground text-xs">→</span>
                                        <FormField
                                            control={form.control}
                                            name={`ports.${index}.containerPort`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={tDocker('containerPort')}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`ports.${index}.protocol`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className="w-16">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel>
                                                                        {tDocker('protocol')}
                                                                    </SelectLabel>
                                                                    <SelectItem value="tcp">
                                                                        TCP
                                                                    </SelectItem>
                                                                    <SelectItem value="udp">
                                                                        UDP
                                                                    </SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="destructiveGhost"
                                            size="icon"
                                            onClick={() => removePort(index)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>{tDocker('envVars')}</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => appendEnv({ key: '', value: '' })}
                            >
                                <Plus className="size-3" />
                                {tDocker('addVariable')}
                            </Button>
                        </div>
                        {envFields.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                {tDocker('noEnvVarsConfigured')}
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {envFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-1.5">
                                        <FormField
                                            control={form.control}
                                            name={`envVars.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={tDocker('keyPlaceholder')}
                                                            className="font-mono"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-muted-foreground text-xs">=</span>
                                        <FormField
                                            control={form.control}
                                            name={`envVars.${index}.value`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={tDocker(
                                                                'valuePlaceholder',
                                                            )}
                                                            className="font-mono"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="destructiveGhost"
                                            size="icon"
                                            onClick={() => removeEnv(index)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FormLabel>{tDocker('volumes')}</FormLabel>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                    appendVolume({
                                        hostPath: '',
                                        containerPath: '',
                                        readOnly: false,
                                    })
                                }
                            >
                                <Plus className="size-3" />
                                {tDocker('addVolume')}
                            </Button>
                        </div>
                        {volumeFields.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                {tDocker('noVolumesConfigured')}
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {volumeFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-1.5">
                                        <FormField
                                            control={form.control}
                                            name={`volumes.${index}.hostPath`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={tDocker('hostPath')}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-muted-foreground text-xs">→</span>
                                        <FormField
                                            control={form.control}
                                            name={`volumes.${index}.containerPath`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={tDocker('containerPath')}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`volumes.${index}.readOnly`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <div className="flex items-center gap-1">
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                            <Label className="text-xs">
                                                                {tDocker('readOnly')}
                                                            </Label>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="destructiveGhost"
                                            size="icon"
                                            onClick={() => removeVolume(index)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
