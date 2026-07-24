import { Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getUserSession } from '@/services/auth/auth.service';
import { getOrganizationDetail } from '@/services/organization.service';
import { MembersSection } from '@/components/organization/members/MembersSection';
import { InviteMemberButton } from '@/components/organization/members/InviteMemberButton';
import { getTranslations } from 'next-intl/server';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';

export default async function OrganizationMembersPage({
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

    if (!detail) notFound();

    const canManageMembers = detail.callerRole === 'owner' || detail.callerRole === 'admin';

    return (
        <BreadcrumbProvider segments={{ organizationId: detail.organization.name }}>
            <div className="flex h-full flex-1 flex-col">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between gap-2 px-5">
                        <div className="flex gap-3">
                            <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                                <Users className="text-primary size-7" />
                            </div>
                            <div className="mt-3.5 flex flex-col">
                                <h1 className="break-all text-3xl font-semibold tracking-tight">
                                    {detail.organization.name}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('members.title')}
                                </p>
                            </div>
                        </div>
                        {canManageMembers && <InviteMemberButton organizationId={organizationId} />}
                    </div>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="px-5 pb-5">
                            <MembersSection
                                organizationId={organizationId}
                                members={detail.members}
                                invitations={detail.invitations}
                                currentUserId={session.user.id}
                                canManageMembers={canManageMembers}
                            />
                        </div>
                    </ScrollAreaWithShadow>
                </div>
            </div>
        </BreadcrumbProvider>
    );
}
