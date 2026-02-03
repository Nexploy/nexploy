'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { useFormContext } from 'react-hook-form';
import { Hammer } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BuildConfigurationStep() {
    const { control, watch } = useFormContext();
    const buildType = watch('buildType');
    const t = useTranslations('repository.steps.buildConfig');

    return (
        <Card>
            <CardHeader>
                <div className={'flex gap-2'}>
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Hammer className="text-primary size-5" />
                    </div>
                    <div className={'flex flex-col'}>
                        <CardTitle>{t('title')}</CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="buildType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('buildType')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectType')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="DOCKERFILE">Dockerfile</SelectItem>
                                    <SelectItem value="DOCKER_COMPOSE">Docker Compose</SelectItem>
                                    <SelectItem value="NIXPACKS">Nixpacks</SelectItem>
                                    <SelectItem value="BUILDPACKS">Buildpacks</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {buildType === 'DOCKERFILE' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={control}
                            name="dockerfilePath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('dockerfilePath')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('dockerfilePathPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="contextPath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('contextPath')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('contextPathPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {buildType === 'DOCKER_COMPOSE' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={control}
                            name="dockerComposePath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('composePath')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('composePathPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="contextPath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('contextPath')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('contextPathPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
