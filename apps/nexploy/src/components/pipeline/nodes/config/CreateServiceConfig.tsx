'use client';

import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
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
import { Button } from '@workspace/ui/components/button';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { Plus, Trash2 } from 'lucide-react';
import { useEnvironmentImages } from '@/hooks/sse/useEnvironmentImages';
import { useMemo } from 'react';
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

export function CreateServiceConfig() {
    const t = useTranslations('repository.pipeline.config');
    const tDocker = useTranslations('docker.createContainer');
    const form = useFormContext();

    const { images, isLoading: imagesLoading } = useEnvironmentImages();

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

    const mode = useWatch({ control: form.control, name: 'mode' });

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
        fields: networkFields,
        append: appendNetwork,
        remove: removeNetwork,
    } = useFieldArray({ control: form.control, name: 'networks' });

    const {
        fields: constraintFields,
        append: appendConstraint,
        remove: removeConstraint,
    } = useFieldArray({ control: form.control, name: 'constraints' });

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createServiceName')}</FormLabel>
                        <FormControl>
                            <RefAware value={field.value} onChange={field.onChange}>
                                <Input {...field} placeholder={t('createServiceNamePlaceholder')} />
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
                                    heading={t('imagesSelectLabel')}
                                />
                            </RefAware>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('createServiceMode')}</FormLabel>
                        <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('createServiceMode')}</SelectLabel>
                                        <SelectItem value="replicated">
                                            {t('createServiceModeReplicated')}
                                        </SelectItem>
                                        <SelectItem value="global">
                                            {t('createServiceModeGlobal')}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                    </FormItem>
                )}
            />

            {mode === 'replicated' && (
                <FormField
                    control={form.control}
                    name="replicas"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('createServiceReplicas')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    min={1}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <FormLabel>{tDocker('ports')}</FormLabel>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                            appendPort({ publishedPort: '', targetPort: '', protocol: 'tcp' })
                        }
                    >
                        <Plus className="size-3" />
                        {tDocker('addPort')}
                    </Button>
                </div>
                <FormField
                    control={form.control}
                    name="portsSource"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RefAware {...field} emptyValue={undefined}>
                                    <div className="text-muted-foreground flex items-center justify-center rounded border border-dashed p-1 text-center text-[10px]">
                                        {tDocker('dragToImportPorts')}
                                    </div>
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                {portFields.length > 0 && (
                    <div className="space-y-1.5">
                        {portFields.map((field, index) => (
                            <div key={field.id} className="flex gap-1.5">
                                <FormField
                                    control={form.control}
                                    name={`ports.${index}.publishedPort`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder={tDocker('hostPort')}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <span className="text-muted-foreground pt-2.5 text-xs">→</span>
                                <FormField
                                    control={form.control}
                                    name={`ports.${index}.targetPort`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder={tDocker('containerPort')}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
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
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
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
                <FormField
                    control={form.control}
                    name="envVarsSource"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <RefAware {...field} emptyValue={undefined}>
                                    <div className="text-muted-foreground flex items-center justify-center rounded border border-dashed p-1 text-center text-[10px]">
                                        {tDocker('dragToImportEnvVars')}
                                    </div>
                                </RefAware>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
                {envFields.length > 0 && (
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
                                            <FormMessage className="text-xs" />
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
                                                    placeholder={tDocker('valuePlaceholder')}
                                                    className="font-mono"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
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

            {/* Networks */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <FormLabel>{t('createServiceNetworks')}</FormLabel>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => appendNetwork({ value: '' })}
                    >
                        <Plus className="size-3" />
                        {t('createServiceAddNetwork')}
                    </Button>
                </div>
                {networkFields.length > 0 && (
                    <div className="space-y-1.5">
                        {networkFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-1.5">
                                <FormField
                                    control={form.control}
                                    name={`networks.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t(
                                                        'createServiceNetworkPlaceholder',
                                                    )}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="destructiveGhost"
                                    size="icon"
                                    onClick={() => removeNetwork(index)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Constraints */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <FormLabel>{t('createServiceConstraints')}</FormLabel>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => appendConstraint({ value: '' })}
                    >
                        <Plus className="size-3" />
                        {t('createServiceAddConstraint')}
                    </Button>
                </div>
                {constraintFields.length > 0 && (
                    <div className="space-y-1.5">
                        {constraintFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-1.5">
                                <FormField
                                    control={form.control}
                                    name={`constraints.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={t(
                                                        'createServiceConstraintPlaceholder',
                                                    )}
                                                    className="font-mono"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="destructiveGhost"
                                    size="icon"
                                    onClick={() => removeConstraint(index)}
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
