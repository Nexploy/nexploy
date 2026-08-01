'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAction } from 'next-safe-action/hooks';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { moveRepositoryToOrganizationAction } from '@/actions/repository/settings/moveRepositoryToOrganization.action';
import { usePermissions } from '@/contexts/PermissionContext';

interface UserOrganization {
    id: string;
    name: string;
    role: string;
}

interface MoveToOrganizationSectionProps {
    repositoryId: string;
    currentOrganizationId: string | null;
}

export function MoveToOrganizationSection({ repositoryId, currentOrganizationId }: MoveToOrganizationSectionProps) {
    const t = useTranslations('repository.settings.organization');
    const { isAdmin } = usePermissions();
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');

    const { data: organizations, isLoading } = useSWR<UserOrganization[]>({ url: '/api/organizations' }, fetcherApi);

    const { executeAsync, isPending } = useAction(moveRepositoryToOrganizationAction.bind(null, repositoryId));

    const canManage = (role: string) => isAdmin || role === 'owner' || role === 'admin';

    const currentOrganization = organizations?.find((org) => org.id === currentOrganizationId);
    const canMoveOut = isAdmin || (currentOrganization ? canManage(currentOrganization.role) : false);

    const targetOrganizations =
        organizations?.filter((org) => org.id !== currentOrganizationId && canManage(org.role)) ?? [];

    const isDisabled = isLoading || isPending || !canMoveOut || targetOrganizations.length === 0;

    const handleMove = async () => {
        if (!selectedOrganizationId) return;
        await executeAsync({ organizationId: selectedOrganizationId });
        setSelectedOrganizationId('');
    };

    return (
        <Card>
            <CardHeaderWithIcon icon={Building2} title={t('title')} description={t('description')} />
            <CardContent className="flex flex-col gap-4">
                {!canMoveOut ? (
                    <p className="text-muted-foreground text-sm">{t('noPermission')}</p>
                ) : targetOrganizations.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noTargetOrganizations')}</p>
                ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <Select
                            value={selectedOrganizationId}
                            onValueChange={setSelectedOrganizationId}
                            disabled={isDisabled}
                        >
                            <SelectTrigger className="w-full sm:max-w-xs">
                                <SelectValue placeholder={t('selectPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {targetOrganizations.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            className="self-start"
                            onClick={handleMove}
                            isLoading={isPending}
                            disabled={isDisabled || !selectedOrganizationId}
                        >
                            {t('move')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
