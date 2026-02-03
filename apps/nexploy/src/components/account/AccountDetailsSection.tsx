import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { AlertTriangle, Bell, Globe, LogOut, Shield } from 'lucide-react';
import { TwoFactorAuth } from '@/components/account/2fa/TwoFactorAuth';
import { ProfileInfoForm } from '@/components/account/2fa/forms/ProfileInfoForm';
import { LanguageSwitcher } from '@/components/account/LanguageSwitcher';
import { NotificationSwitch } from '@/components/account/NotificationSwitch';
import { SignOutButton } from '@/components/account/SignOutButton';
import { ChangePassword } from '@/components/account/ChangePassword';
import { getUserSession } from '@/services/auth/auth.service';
import { Label } from '@workspace/ui/components/label';
import { getTranslations } from 'next-intl/server';

export async function AccountDetailsSection() {
    const session = await getUserSession();
    const t = await getTranslations('account');

    return (
        <div className="flex flex-col gap-5">
            <ProfileInfoForm user={session?.user} />

            <Card id="security">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        {t('securitySettings.title')}
                    </CardTitle>
                    <CardDescription>{t('securitySettings.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TwoFactorAuth user={session?.user} />
                        <ChangePassword />
                    </div>
                </CardContent>
            </Card>

            <Card id="notifications">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="size-5" />
                        {t('notifications.title')}
                    </CardTitle>
                    <CardDescription>{t('notifications.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <NotificationSwitch
                        label={t('alerts.dockerAlerts')}
                        description={t('alerts.containerStatusChanges')}
                    />
                </CardContent>
            </Card>

            <Card id="regional">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="size-5" />
                        {t('regional.title')}
                    </CardTitle>
                    <CardDescription>{t('regional.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('regional.language')}</Label>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card id="danger-zone" className="border-destructive">
                <CardHeader className="">
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="size-5" />
                        {t('dangerZone.title')}
                    </CardTitle>
                    <CardDescription>{t('dangerZone.description')}</CardDescription>
                </CardHeader>
                <CardContent className={'flex flex-col gap-4'}>
                    <div className="border-destructive/50 flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <LogOut className="text-destructive size-4" />
                                <p className="font-medium">{t('dangerZone.signOut')}</p>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {t('dangerZone.signOutDescription')}
                            </p>
                        </div>
                        <SignOutButton
                            variant={'button'}
                            buttonVariant="destructive"
                            className="shrink-0"
                            showIcon={false}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
