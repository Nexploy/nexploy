import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Bell, Globe, Shield } from 'lucide-react';
import { TwoFactorAuth } from '@/components/account/2fa/TwoFactorAuth';
import { ProfileInfoForm } from '@/components/account/2fa/forms/ProfileInfoForm';
import { LanguageSwitcher } from '@/components/account/LanguageSwitcher';
import { NotificationSwitch } from '@/components/account/NotificationSwitch';
import { getUserSession } from '@/services/auth/auth.service';
import { Label } from '@workspace/ui/components/label';

export async function AccountDetailsSection() {
    const session = await getUserSession();

    return (
        <div className="flex flex-col gap-5">
            <ProfileInfoForm user={session?.user} />
            <Card id="security">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        Security Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your account security and authentication preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TwoFactorAuth user={session?.user} />
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <p>Password</p>
                                <p className="text-muted-foreground text-xs">
                                    Last changed 30 days ago
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                Change
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card id="notifications">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="size-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Control how and when you receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <NotificationSwitch
                        label="Docker Alerts"
                        description="Container status changes"
                    />
                </CardContent>
            </Card>

            <Card id="regional">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="size-5" />
                        Regional Settings
                    </CardTitle>
                    <CardDescription>
                        Configure your language and timezone preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Language</Label>
                            <LanguageSwitcher />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
