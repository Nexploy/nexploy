'use client';

import { GitBranch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import { relinkGitAccountAction } from '@/actions/repository/relinkGitAccount.action';
import { relinkGitAccountSchema } from '@workspace/schemas-zod/repository/relinkGitAccount.schema';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { GitAccountFormField } from '@/components/git/GitAccountFormField';
import { usePermissions } from '@/contexts/PermissionContext';

interface SwitchGitAccountSectionProps {
    repositoryId: string;
    currentGitAccountId: string | null;
    isOwner: boolean;
}

export function SwitchGitAccountSection({
    repositoryId,
    currentGitAccountId,
    isOwner,
}: SwitchGitAccountSectionProps) {
    const t = useTranslations('repository.settings.gitAccount');
    const tSource = useTranslations('repository.steps.gitSource');
    const { isAdmin } = usePermissions();

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        relinkGitAccountAction.bind(null, repositoryId),
        zodResolver(relinkGitAccountSchema),
        {
            formProps: {
                defaultValues: { gitAccountId: currentGitAccountId ?? '' },
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={GitBranch}
                title={t('title')}
                description={t('description')}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                        <GitAccountFormField
                            noAccountsContent={
                                <p className="text-muted-foreground text-sm">
                                    {tSource('noAccounts')}
                                </p>
                            }
                        />
                        <Button
                            type="submit"
                            className="self-start"
                            isLoading={action.isPending}
                            disabled={action.isPending || !form.formState.isDirty}
                        >
                            {t('save')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
