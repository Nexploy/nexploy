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
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { useEnvironmentNetworks } from '@/hooks/sse/useEnvironmentNetworks';
import { useMemo } from 'react';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function CreateContainerConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tDocker = useTranslations('docker.createContainer');
    const form = useFormContext();

    const environmentId = usePipelineEnvironmentId();

    const { images, isLoading: imagesLoading } = useEnvironmentImages(environmentId);
    const { networks, isLoading: networksLoading } = useEnvironmentNetworks(environmentId);

    const networkOptions = useMemo(() => {
        return networks
            .map((n) => ({ value: n.name, label: n.name }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [networks]);

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
            <FormField
                control={form.control}
                name="containerName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createContainerName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input
                                    {...field}
                                    placeholder={t('createContainerNamePlaceholder')}
                                />
                            </RefAware>
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
                            <RefAware value={field.value} onChange={field.onChange}>
                                <InputAutoComplete
                                    {...field}
                                    className="truncate"
                                    options={imageOptions}
                                    isLoading={imagesLoading}
                                    placeholder={t('createContainerImagePlaceholder')}
                                    heading={t('availableImages')}
                                />
                            </RefAware>
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
                            <RefAware value={field.value} onChange={field.onChange}>
                                <InputAutoComplete
                                    {...field}
                                    className="truncate"
                                    options={networkOptions}
                                    isLoading={networksLoading}
                                    placeholder={t('createContainerNetworkPlaceholder')}
                                    heading={t('availableNetworks')}
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

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
                    <p className="text-muted-foreground text-xs">{tDocker('noPortsConfigured')}</p>
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
                                                <RefAware
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                >
                                                    <Input
                                                        {...field}
                                                        value={
                                                            typeof field.value === 'string'
                                                                ? field.value
                                                                : ''
                                                        }
                                                        placeholder={tDocker('hostPort')}
                                                    />
                                                </RefAware>
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
                                                <RefAware
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                >
                                                    <Input
                                                        {...field}
                                                        value={
                                                            typeof field.value === 'string'
                                                                ? field.value
                                                                : ''
                                                        }
                                                        placeholder={tDocker('containerPort')}
                                                    />
                                                </RefAware>
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
                                                            <SelectItem value="tcp">TCP</SelectItem>
                                                            <SelectItem value="udp">UDP</SelectItem>
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
                                                <RefAware
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                >
                                                    <Input
                                                        {...field}
                                                        value={
                                                            typeof field.value === 'string'
                                                                ? field.value
                                                                : ''
                                                        }
                                                        placeholder={tDocker('keyPlaceholder')}
                                                        className="font-mono"
                                                    />
                                                </RefAware>
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
                                                <RefAware
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                >
                                                    <Input
                                                        {...field}
                                                        value={
                                                            typeof field.value === 'string'
                                                                ? field.value
                                                                : ''
                                                        }
                                                        placeholder={tDocker('valuePlaceholder')}
                                                        className="font-mono"
                                                    />
                                                </RefAware>
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
                                                <RefAware
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                >
                                                    <Input
                                                        {...field}
                                                        value={
                                                            typeof field.value === 'string'
                                                                ? field.value
                                                                : ''
                                                        }
                                                        placeholder={tDocker('hostPath')}
                                                    />
                                                </RefAware>
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
                                                <RefAware
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                >
                                                    <Input
                                                        {...field}
                                                        value={
                                                            typeof field.value === 'string'
                                                                ? field.value
                                                                : ''
                                                        }
                                                        placeholder={tDocker('containerPath')}
                                                    />
                                                </RefAware>
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
        </div>
    );
}
