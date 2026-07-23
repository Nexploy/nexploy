import Link from 'next/link';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { getUserSession } from '@/services/auth/auth.service';
import { getUserOrganizations } from '@/services/organization.service';
import { getTranslations } from 'next-intl/server';

export async function OrganizationsList() {
    const session = await getUserSession();
    const t = await getTranslations('organization');

    if (!session) return null;

    const organizations = await getUserOrganizations(session.user.id);

    if (organizations.length === 0) {
        return <p className="text-muted-foreground text-sm">{t('noOrganizations')}</p>;
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((organization) => (
                <Link key={organization.id} href={`/organizations/${organization.id}/members`}>
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardContent className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg font-semibold">
                                {organization.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <span className="truncate font-medium">{organization.name}</span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {organization.slug}
                                </span>
                            </div>
                            <Badge variant="outline">{t(`roles.${organization.role}`)}</Badge>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
