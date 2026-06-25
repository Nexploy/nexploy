import { Card, CardContent } from '@workspace/ui/components/card';
import { Bell, Plug, Shield } from 'lucide-react';
import { TwoFactorAuth } from '@/components/account/2fa/TwoFactorAuth';
import { ProfileInfoForm } from '@/components/account/2fa/forms/ProfileInfoForm';
import { NotificationPreferences } from '@/components/account/NotificationPreferences';
import { ChangePassword } from '@/components/account/ChangePassword';
import { getUserSession } from '@/services/auth/auth.service';
import { getTranslations } from 'next-intl/server';
import { AcountIntegrations } from '@/components/account/AccountIntegrations';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

export async function AccountDetailsSection() {
    const session = await getUserSession();
    const t = await getTranslations('account');

    return (
        <div className="flex flex-col gap-5">
            <ProfileInfoForm user={session?.user} />

            <Card id="security">
                <CardHeaderWithIcon
                    icon={Shield}
                    title={t('securitySettings.title')}
                    description={t('securitySettings.description')}
                />
                <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <TwoFactorAuth user={session?.user} />
                    <ChangePassword />
                </CardContent>
            </Card>

            <Card id="integrations">
                <CardHeaderWithIcon
                    icon={Plug}
                    title={t('integrations.title')}
                    description={t('integrations.description')}
                />
                <CardContent>
                    <AcountIntegrations />
                </CardContent>
            </Card>

            <Card id="notifications">
                <CardHeaderWithIcon
                    icon={Bell}
                    title={t('notifications.title')}
                    description={t('notifications.description')}
                />
                <CardContent>
                    <NotificationPreferences />
                </CardContent>
            </Card>
        </div>
    );
}
