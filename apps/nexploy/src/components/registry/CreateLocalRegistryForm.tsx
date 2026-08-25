'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLocalRegistrySchema, LOCAL_REGISTRY_IMAGE } from '@workspace/schemas-zod/registry/registry.schema';
import { createLocalRegistryAction } from '@/actions/registry/createLocalRegistry.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Switch } from '@workspace/ui/components/switch';
import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const DEFAULT_PORT = 5000;
const DEFAULT_CONTAINER_NAME = 'nexploy-registry';
const DEFAULT_DATA_PATH = '/var/lib/nexploy/registry';
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];

function defaultReachableHost(): string {
    if (typeof window === 'undefined') return '';

    const hostname = window.location.hostname;

    return LOOPBACK_HOSTS.includes(hostname) ? '' : hostname;
}

export function CreateLocalRegistryForm() {
    const t = useTranslations('admin.registry');
    const { closeDialog } = useConfirmationDialogStore();

    const { form, handleSubmitWithAction } = useHookFormAction(
        createLocalRegistryAction,
        zodResolver(createLocalRegistrySchema),
        {
            formProps: {
                defaultValues: {
                    name: 'Local registry',
                    containerName: DEFAULT_CONTAINER_NAME,
                    host: defaultReachableHost(),
                    port: DEFAULT_PORT,
                    dataPath: DEFAULT_DATA_PATH,
                    secure: false,
                    username: '',
                    password: '',
                },
            },
            actionProps: {
                onSuccess: () => {
                    toast.success(t('localCreateSuccess'));
                    closeDialog();
                },
            },
        },
    );

    const isSubmitting = form.formState.isSubmitting;
    const isSecure = form.watch('secure');

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('nameLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('namePlaceholder')} disabled={isSubmitting} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{isSecure ? t('localDomainLabel') : t('localHostLabel')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('localHostPlaceholder')} disabled={isSubmitting} {...field} />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">
                                {isSecure ? t('localDomainDescription') : t('localHostDescription')}
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!isSecure && (
                    <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('localPortLabel')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        disabled={isSubmitting}
                                        {...field}
                                        value={String(field.value ?? '')}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="containerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('localContainerNameLabel')}</FormLabel>
                            <FormControl>
                                <Input disabled={isSubmitting} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dataPath"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('localDataPathLabel')}</FormLabel>
                            <FormControl>
                                <Input disabled={isSubmitting} {...field} />
                            </FormControl>
                            <p className="text-muted-foreground text-xs">{t('localDataPathDescription')}</p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="secure"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5 pr-4">
                                <FormLabel>{t('localSecureLabel')}</FormLabel>
                                <p className="text-muted-foreground text-xs">{t('localSecureDescription')}</p>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {isSecure && (
                    <>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('usernameLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('usernamePlaceholder')}
                                            autoComplete="off"
                                            disabled={isSubmitting}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('passwordLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={t('passwordPlaceholder')}
                                            autoComplete="new-password"
                                            disabled={isSubmitting}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                <Alert variant="info">
                    <TriangleAlert />
                    <AlertDescription>
                        {isSecure ? t('localSecureWarning') : t('localInsecureWarning')}
                    </AlertDescription>
                </Alert>

                <p className="text-muted-foreground text-xs">{t('localImageHint', { image: LOCAL_REGISTRY_IMAGE })}</p>

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                        {t('localCreate')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
