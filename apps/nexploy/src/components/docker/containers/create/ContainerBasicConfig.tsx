'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Settings } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import { useImagesStore } from '@/stores/docker/useImagesStore.ts';
import { useMemo } from 'react';
import { DockerHubSearchDialog } from '@/components/docker/image/pull/DockerHubSearchDialog.tsx';
import { Button } from '@workspace/ui/components/button.tsx';
import { Docker } from '@thesvg/react';
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { RegistryInfo } from '@/services/registry.service';

export function ContainerBasicConfig() {
    const t = useTranslations('docker.createContainer');
    const tCommon = useTranslations('common');
    const form = useFormContext();

    const images = useImagesStore((state) => state.images);

    const imageOptions = useMemo(() => {
        const names = new Set<string>();
        for (const img of images) {
            for (const repoTag of img.repoTags ?? []) {
                if (repoTag === '<none>:<none>') continue;
                names.add(repoTag);
            }
        }
        return Array.from(names)
            .sort()
            .map((name) => ({ value: name, label: name }));
    }, [images]);

    const selectedImage = form.watch('image');

    const { data: registries = [] } = useSWR<RegistryInfo[]>(
        { url: '/api/registries' },
        fetcherApi,
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Settings}
                title={t('basicConfig')}
                description={t('basicConfigDescription')}
            />
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('containerName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('containerNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>{t('containerNameDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dockerImage')}</FormLabel>
                            <FormControl>
                                <div className={'flex'}>
                                    <InputAutoComplete
                                        {...field}
                                        className={'w-full flex-1 rounded-r-none'}
                                        options={imageOptions}
                                        heading={t('availableImages')}
                                        autoComplete="off"
                                        placeholder="postgres:latest"
                                    />
                                    <DockerHubSearchDialog
                                        onSelect={(image) =>
                                            form.setValue('image', `${image.slug}:latest`)
                                        }
                                        isSelected={(image) =>
                                            selectedImage === `${image.slug}:latest`
                                        }
                                        trigger={
                                            <Button className={'rounded-l-none font-semibold'}>
                                                <Docker className="size-4 [&_path]:fill-current" />
                                                {t('dockerHub')}
                                            </Button>
                                        }
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>{t('dockerImageDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {registries.length > 0 && (
                    <FormField
                        control={form.control}
                        name="registryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('registryLabel')}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value ?? 'none'}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('registryNone')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="none">
                                                {t('registryNone')}
                                            </SelectItem>
                                            {registries.map((registry) => (
                                                <SelectItem key={registry.id} value={registry.id}>
                                                    {registry.name} ({registry.url})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormDescription>{t('registryDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="hostname"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('hostname')}
                                <span className="text-muted-foreground text-xs">
                                    {tCommon('optional')}
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input placeholder={t('hostnamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="restart"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('restartPolicy')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectPolicy')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{t('restartPolicy')}</SelectLabel>
                                        <SelectItem value="no">{t('restartNever')}</SelectItem>
                                        <SelectItem value="always">{t('restartAlways')}</SelectItem>
                                        <SelectItem value="on-failure">
                                            {t('restartOnFailure')}
                                        </SelectItem>
                                        <SelectItem value="unless-stopped">
                                            {t('restartUnlessStopped')}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="autoRemove"
                        render={({ field }) => (
                            <FormItem>
                                <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-base">{t('autoRemove')}</span>
                                        <FormDescription className="m-0">
                                            {t('autoRemoveDescription')}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            className={'cursor-pointer'}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </Label>
                            </FormItem>
                        )}
                    />

                </div>
            </CardContent>
        </Card>
    );
}
