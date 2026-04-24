'use client';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Building2 } from 'lucide-react';
import { providerIcons } from '@/components/git/providerIcons';
import { getHostname } from '@/utils/url';
import useSWR from 'swr';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useAction } from 'next-safe-action/hooks';
import { relinkGitAccountAction } from '@/actions/repository/relinkGitAccount.action';
import { toast } from 'sonner';
import Link from 'next/link';

interface GitAccountSummary {
    id: string;
    provider: string;
    providerAccountId: string;
    providerUsername: string | null;
    gitProviderId: string;
    gitProvider: {
        displayName: string;
        ownerName: string | null;
        ownerType: string | null;
        baseUrl: string | null;
    };
}

interface ReassociateGitAccountFormProps {
    repositoryId: string;
}

export function ReassociateGitAccountForm({ repositoryId }: ReassociateGitAccountFormProps) {
    const t = useTranslations('repository.reassociateGitAccount');
    const tSource = useTranslations('repository.steps.gitSource');

    const { data: accounts } = useSWR<GitAccountSummary[]>(
        { url: '/api/git/accounts' },
        fetcherApi,
    );
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    const { execute, isPending } = useAction(relinkGitAccountAction.bind(null, repositoryId), {
        onSuccess: () => {
            toast.success(t('success'));
        },
        onError: () => {
            toast.error(t('error'));
        },
    });

    const hasAccounts = accounts && accounts.length > 0;

    return (
        <div className="flex flex-col gap-4">
            {!hasAccounts ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6 text-center text-sm">
                    <span>{tSource('noAccounts')}</span>
                    <Button asChild size="sm">
                        <Link href="/account#integrations">{tSource('connectAccount')}</Link>
                    </Button>
                </div>
            ) : (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                        <SelectValue placeholder={tSource('selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{tSource('account')}</SelectLabel>
                            {accounts.map((account) => {
                                const isOrg = account.gitProvider.ownerType === 'Organization';
                                const hostname = getHostname(account.gitProvider.baseUrl);
                                return (
                                    <SelectItem key={account.id} value={account.id}>
                                        <span className="flex items-center gap-2">
                                            {providerIcons[account.provider]}
                                            <span>
                                                {account.providerUsername ??
                                                    account.providerAccountId}
                                            </span>
                                            {hostname && (
                                                <span className="text-muted-foreground text-xs">
                                                    {hostname}
                                                </span>
                                            )}
                                            {isOrg && (
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 py-0 text-xs"
                                                >
                                                    <Building2 className="size-3" />
                                                    {account.gitProvider.ownerName}
                                                </Badge>
                                            )}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            )}

            <Button
                disabled={!selectedAccountId || isPending}
                onClick={() => execute({ gitAccountId: selectedAccountId })}
            >
                {isPending ? t('saving') : t('save')}
            </Button>
        </div>
    );
}
