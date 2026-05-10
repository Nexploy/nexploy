'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card, CardContent } from '@workspace/ui/components/card';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { InputAutoComplete } from '@workspace/ui/components/search-command';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useImagesStore } from '@/stores/docker/useImagesStore.ts';
import { useMemo } from 'react';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Settings } from 'lucide-react';

export function ServiceBasicConfig() {
    const t = useTranslations('swarm.createService');
    const tCommon = useTranslations('common');
    const form = useFormContext();
    const mode = useWatch({ control: form.control, name: 'mode' });

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
                            <FormLabel>{t('serviceName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('serviceNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>{t('serviceNameDescription')}</FormDescription>
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
                                    placeholder="nginx:latest"
                                />
                            </FormControl>
                            <FormDescription>{t('dockerImageDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="mode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('deploymentMode')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('deploymentMode')}</SelectLabel>
                                            <SelectItem value="replicated">
                                                {t('modeReplicated')}
                                            </SelectItem>
                                            <SelectItem value="global">
                                                {t('modeGlobal')}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {mode === 'replicated' && (
                        <FormField
                            control={form.control}
                            name="replicas"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('replicaCount')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            min={1}
                                            onChange={(e) =>
                                                field.onChange(
                                                    isNaN(e.target.valueAsNumber)
                                                        ? 1
                                                        : e.target.valueAsNumber,
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {t('replicaCountDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <div className="grid items-start gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="command"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('command')}
                                    <span className="text-muted-foreground text-xs">
                                        {tCommon('optional')}
                                    </span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('commandPlaceholder')}
                                        className="font-mono"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>{t('commandDescription')}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="workDir"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('workDir')}
                                    <span className="text-muted-foreground text-xs">
                                        {tCommon('optional')}
                                    </span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('workDirPlaceholder')}
                                        className="font-mono"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="user"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {t('user')}
                                    <span className="text-muted-foreground text-xs">
                                        {tCommon('optional')}
                                    </span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={t('userPlaceholder')}
                                        className="font-mono"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
