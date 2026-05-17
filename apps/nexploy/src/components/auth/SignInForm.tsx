'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { onSignInAction } from '@/actions/auth/signIn.action';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
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
import { useTranslations } from 'next-intl';

export function SignInForm() {
    const tAuth = useTranslations('auth.signIn');

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        onSignInAction,
        zodResolver(signInFormSchema),
        {
            formProps: {
                defaultValues: {
                    email: '',
                    password: '',
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">{tAuth('title')}</CardTitle>
                    <CardDescription>{tAuth('description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Form {...form}>
                        <form onSubmit={handleSubmitWithAction} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{tAuth('emailLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                placeholder={tAuth('emailPlaceholder')}
                                                disabled={isSubmitting}
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
                                        <FormLabel>{tAuth('passwordLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder={tAuth('passwordPlaceholder')}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.formState.errors.root?.message && (
                                <span className={'text-destructive mb-4 flex text-sm'}>
                                    {form.formState.errors.root?.message}
                                </span>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? tAuth('submitLoading') : tAuth('submit')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
