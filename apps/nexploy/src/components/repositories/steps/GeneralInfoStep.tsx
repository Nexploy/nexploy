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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

export function GeneralInfoStep() {
    const { control } = useFormContext();
    const t = useTranslations('repository.steps.generalInfo');

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('projectName')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('projectNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormDescription>{t('projectNameDescription')}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                {t('descriptionLabel')}{' '}
                                <span className="text-muted-foreground text-xs">(optionnel)</span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('descriptionPlaceholder')}
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
