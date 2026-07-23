import { Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Button } from '@workspace/ui/components/button';
import { BackButton } from '@/components/shared/BackButton';
import { getUserSession } from '@/services/auth/auth.service';
import { getOrganizationDetail } from '@/services/organization.service';
import { MembersSection } from '@/components/organization/members/MembersSection';
import { InviteMemberButton } from '@/components/organization/members/InviteMemberButton';
import { getTranslations } from 'next-intl/server';

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
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Users className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {detail.organization.name}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('members.title')}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                        <BackButton />
                        {detail.callerRole === 'owner' && (
                            <Button variant="outline" size="icon" asChild>
                                <Link href={`/organizations/${organizationId}/settings`}>
                                    <Settings />
                                </Link>
                            </Button>
                        )}
                        {canManageMembers && (
                            <InviteMemberButton organizationId={organizationId} />
                        )}
                    </div>
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
    );
}
