'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { mirrorImageSchema } from '@workspace/schemas-zod/registry/mirrorImage.schema';
import { mirrorImageAction } from '@/actions/registry/mirrorImage.action';
import { Button } from '@workspace/ui/components/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import type { RegistryInfo } from '@/services/registry.service';
import { GitFork } from 'lucide-react';

interface MirrorImageSectionProps {
    registries: RegistryInfo[];
}

export function MirrorImageSection({ registries }: MirrorImageSectionProps) {
    const t = useTranslations('admin.registry');
    const tValidation = useTranslations('validation');
    const [privateSource, setPrivateSource] = useState(false);

    const { form, handleSubmitWithAction, resetFormAndAction } = useHookFormAction(
        mirrorImageAction,
        zodResolver(mirrorImageSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    sourceImage: '',
                    sourceUsername: '',
                    sourcePassword: '',
                    targetRegistryId: registries[0]?.id || '',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    toast.success(t('mirrorSuccess', { target: data?.targetName ?? '' }));
                    resetFormAndAction();
                    setPrivateSource(false);
                },
                onError: ({ error }) => {
                    const message =
                        error.serverError ||
                        error.validationErrors?._errors?.[0] ||
                        t('mirrorFailed');
                    toast.error(message);
                },
            },
        },
    );

    const isSubmitting = form.formState.isSubmitting;

    if (registries.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <GitFork className="text-primary size-5" />
                </div>
                <div>
                    <CardTitle>{t('mirrorTitle')}</CardTitle>
                    <CardDescription>{t('mirrorDescription')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="sourceImage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('sourceImageLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('sourceImagePlaceholder')}
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center gap-2">
                            <Switch
                                id="private-source"
                                checked={privateSource}
                                onCheckedChange={setPrivateSource}
                                disabled={isSubmitting}
                            />
                            <label
                                htmlFor="private-source"
                                className="cursor-pointer text-sm font-medium"
                            >
                                {t('privateSource')}
                            </label>
                        </div>

                        {privateSource && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="sourceUsername"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('sourceUsernameLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('sourceUsernamePlaceholder')}
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sourcePassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('sourcePasswordLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder={t('sourcePasswordPlaceholder')}
                                                    disabled={isSubmitting}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="targetRegistryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('targetRegistryLabel')}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectRegistry')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    {t('targetRegistryLabel')}
                                                </SelectLabel>
                                                {registries.map((registry) => (
                                                    <SelectItem
                                                        key={registry.id}
                                                        value={registry.id}
                                                    >
                                                        {registry.name} ({registry.url})
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                            {t('mirror')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
