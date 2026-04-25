import { Card, CardContent } from '@workspace/ui/components/card';
import { Bell, Globe, Plug, Shield } from 'lucide-react';
import { TwoFactorAuth } from '@/components/account/2fa/TwoFactorAuth';
import { ProfileInfoForm } from '@/components/account/2fa/forms/ProfileInfoForm';
import { LanguageSwitcher } from '@/components/account/LanguageSwitcher';
import { NotificationSwitch } from '@/components/account/NotificationSwitch';
import { ChangePassword } from '@/components/account/ChangePassword';
import { getUserSession } from '@/services/auth/auth.service';
import { Label } from '@workspace/ui/components/label';
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
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TwoFactorAuth user={session?.user} />
                        <ChangePassword />
                    </div>
                </CardContent>
            </Card>

            <Card id="integrations">
                <CardHeaderWithIcon
                    icon={Plug}
                    title={t('integrations.title')}
                    description={t('integrations.description')}
                />
                <CardContent className="space-y-4">
                    <AcountIntegrations />
                </CardContent>
            </Card>

            <Card id="notifications">
                <CardHeaderWithIcon
                    icon={Bell}
                    title={t('notifications.title')}
                    description={t('notifications.description')}
                />
                <CardContent className="space-y-4">
                    <NotificationSwitch
                        label={t('alerts.dockerAlerts')}
                        description={t('alerts.containerStatusChanges')}
                    />
                </CardContent>
            </Card>

            <Card id="regional">
                <CardHeaderWithIcon
                    icon={Globe}
                    title={t('regional.title')}
                    description={t('regional.description')}
                />
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('regional.language')}</Label>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
