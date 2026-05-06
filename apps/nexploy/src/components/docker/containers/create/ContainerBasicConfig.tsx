'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
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
import { useImageStore } from '@/stores/docker/useImageStore.ts';
import { useMemo } from 'react';

export function ContainerBasicConfig() {
    const t = useTranslations('docker.createContainer');
    const tCommon = useTranslations('common');
    const form = useFormContext();

    const images = useImageStore((state) => state.images);

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('basicConfig')}</CardTitle>
                <CardDescription>{t('basicConfigDescription')}</CardDescription>
            </CardHeader>
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
                                <InputAutoComplete
                                    {...field}
                                    options={imageOptions}
                                    heading={t('availableImages')}
                                    autoComplete="off"
                                    placeholder="postgres:latest"
                                />
                            </FormControl>
                            <FormDescription>{t('dockerImageDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </Label>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="privileged"
                        render={({ field }) => (
                            <FormItem>
                                <Label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-base">{t('privilegedMode')}</span>
                                        <FormDescription className="m-0">
                                            {t('privilegedModeDescription')}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
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
