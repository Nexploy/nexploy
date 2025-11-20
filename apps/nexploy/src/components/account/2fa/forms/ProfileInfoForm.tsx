'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { User } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { InputGroup, InputGroupInput } from '@workspace/ui/components/input-group';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { onChangeUsernameAction } from '@/actions/docker/auth/changeUsername.action';
import { changeUsernameFormSchema } from '@workspace/schemas-zod/auth/auth.schema';
import { Session } from '@/lib/auth/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProfileInfoFormProps {
    user?: Session['user'];
}

export function ProfileInfoForm({ user }: ProfileInfoFormProps) {
    const tValidation = useTranslations('validation');
    const router = useRouter();

    const { form, handleSubmitWithAction } = useHookFormAction(
        onChangeUsernameAction,
        zodResolver(changeUsernameFormSchema(tValidation)),
        {
            formProps: {
                defaultValues: {
                    newName: user?.name ?? '',
                },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    toast.success('Username updated successfully');
                    router.refresh();
                    form.reset({
                        newName: input.newName,
                    });
                },
            },
        },
    );

    return (
        <Card id="profile">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="size-5" />
                    Profile Information
                </CardTitle>
                <CardDescription>
                    Manage your personal information and account details
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Form {...form}>
                    <form className={'flex flex-col gap-4'} onSubmit={handleSubmitWithAction}>
                        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="newName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <InputGroup>
                                        <InputGroupInput defaultValue={user?.email} readOnly />
                                    </InputGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </div>
                        <Button
                            type="submit"
                            disabled={!form.formState.isDirty}
                            className={'self-end'}
                        >
                            Update profile
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
