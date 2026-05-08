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
import { Tag } from 'lucide-react';

export function ImageNameConfig() {
    const t = useTranslations('docker.pullImagePage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeaderWithIcon
                icon={Tag}
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
