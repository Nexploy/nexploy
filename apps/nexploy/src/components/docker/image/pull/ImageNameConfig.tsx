'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';

export function ImageNameConfig() {
    const t = useTranslations('docker.pullImagePage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('configuration')}</CardTitle>
                <CardDescription>{t('configDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="imageName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('imageName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('imageNamePlaceholder')} />
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
