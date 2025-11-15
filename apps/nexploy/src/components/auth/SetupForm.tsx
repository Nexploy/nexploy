'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { onSetupAction } from '@/actions/docker/auth/setup.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { setupFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SetupForm() {
    const tValidation = useTranslations('validation');
    const tAuth = useTranslations('auth');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onSetupAction,
        zodResolver(setupFormSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="text-primary h-8 w-8" />
                        <CardTitle className="text-3xl">{tAuth('setup.title')}</CardTitle>
                    </div>
                    <CardDescription>{tAuth('setup.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={handleSubmitWithAction} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    {tAuth('setup.personalInfo')}
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{tAuth('setup.nameLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder={tAuth('setup.namePlaceholder')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{tAuth('setup.emailLabel')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder={tAuth('setup.emailPlaceholder')}
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{tAuth('setup.passwordLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{tAuth('setup.confirmPasswordLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder="••••••••"
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.root?.message && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        {form.formState.errors.root?.message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? tAuth('setup.submitLoading')
                                    : tAuth('setup.submit')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
