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
import { CheckboxField } from '@/components/forms/CheckboxField';
import { NetworkDriverSelect } from '@/components/docker/network/NetworkDriverSelect';
import { NetworkScopeSelect } from '@/components/docker/network/NetworkScopeSelect';

export function NetworkBasicConfig() {
    const t = useTranslations('docker.createNetworkPage');
    const form = useFormContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('basicConfig')}</CardTitle>
                <CardDescription>{t('configureParams')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('networkName')}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={t('networkNamePlaceholder')} />
                            </FormControl>
                            <FormMessage />
                            <FormDescription>{t('networkNameDescription')}</FormDescription>
                        </FormItem>
                    )}
                />

                <CheckboxField
                    control={form.control}
                    name="checkDuplicate"
                    label={t('checkDuplicate')}
                    description={t('checkDuplicateDescription')}
                />

                <NetworkDriverSelect />
                <NetworkScopeSelect />

                <div className="space-y-4 pt-2">
                    <CheckboxField
                        control={form.control}
                        name="enableIPv4"
                        label={t('enableIPv4')}
                        description={t('enableIPv4Description')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="enableIPv6"
                        label={t('enableIPv6')}
                        description={t('enableIPv6Description')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="internal"
                        label={t('internalNetwork')}
                        description={t('internalNetworkDescription')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="attachable"
                        label={t('attachable')}
                        description={t('attachableDescription')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="ingress"
                        label={t('ingress')}
                        description={t('ingressDescription')}
                    />
                    <CheckboxField
                        control={form.control}
                        name="configOnly"
                        label={t('configOnly')}
                        description={t('configOnlyDescription')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
