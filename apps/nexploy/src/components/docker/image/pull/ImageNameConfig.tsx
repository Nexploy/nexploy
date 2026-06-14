'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
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
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { Settings } from 'lucide-react';
import { DockerHubSearchDialog } from '@/components/docker/image/pull/DockerHubSearchDialog.tsx';
import { Button } from '@workspace/ui/components/button.tsx';
import { Docker } from '@thesvg/react';

export function ImageNameConfig() {
    const t = useTranslations('docker.pullImagePage');
    const form = useFormContext();

    const selectedImage = form.watch('imageName');

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Settings}
                title={t('configuration')}
                description={t('configDescription')}
            />
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="imageName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('imageName')}</FormLabel>
                            <FormControl>
                                <div className={'flex'}>
                                    <Input
                                        {...field}
                                        className={'rounded-r-none'}
                                        placeholder={t('imageNamePlaceholder')}
                                    />
                                    <DockerHubSearchDialog
                                        onSelect={(image) =>
                                            form.setValue('imageName', `${image.slug}:latest`)
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
                            <FormMessage />
                            <FormDescription>{t('imageNameDescription')}</FormDescription>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
