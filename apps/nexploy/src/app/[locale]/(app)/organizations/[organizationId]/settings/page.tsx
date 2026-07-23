import { Settings } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { BackButton } from '@/components/shared/BackButton';
import { Card, CardContent } from '@workspace/ui/components/card';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { getUserSession } from '@/services/auth/auth.service';
import { getOrganizationDetail } from '@/services/organization.service';
import { RenameOrganizationForm } from '@/components/organization/settings/RenameOrganizationForm';
import { DeleteOrganizationButton } from '@/components/organization/settings/DeleteOrganizationButton';
import { getTranslations } from 'next-intl/server';

export default async function OrganizationSettingsPage({
    params,
}: {
    params: Promise<{ organizationId: string }>;
}) {
    const { organizationId } = await params;
    const t = await getTranslations('organization');
    const session = await getUserSession();

    if (!session) notFound();

    const detail = await getOrganizationDetail(
        organizationId,
        session.user.id,
        session.user.role === 'admin',
    );

    if (!detail || (detail.callerRole !== 'owner' && session.user.role !== 'admin')) {
        notFound();
    }

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Settings className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {detail.organization.name}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('settings.title')}</p>
                        </div>
                    </div>
                    <div className="mt-5">
                        <BackButton />
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="flex flex-col gap-5 pb-5">
                        <Card>
                            <CardHeaderWithIcon
                                icon={Settings}
                                title={t('settings.general')}
                                description={t('settings.generalDescription')}
                            />
                            <CardContent>
                                <RenameOrganizationForm
                                    organizationId={organizationId}
                                    name={detail.organization.name}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeaderWithIcon
                                isDestructive
                                icon={Settings}
                                title={t('settings.dangerZone')}
                                description={t('settings.dangerZoneDescription')}
                            />
                            <CardContent>
                                <DeleteOrganizationButton
                                    organizationId={organizationId}
                                    organizationName={detail.organization.name}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
