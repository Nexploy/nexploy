import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Bell, Globe, Shield } from 'lucide-react';
import { TwoFactorAuth } from '@/components/account/2fa/TwoFactorAuth';
import { ProfileInfoForm } from '@/components/account/2fa/forms/ProfileInfoForm';
import { getUserSession } from '@/services/auth/auth.service';

export async function AccountDetailsSection() {
    const session = await getUserSession();

    return (
        <div className="flex flex-col gap-6">
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
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Docker Alerts</p>
                                <p className="text-muted-foreground text-sm">
                                    Container status changes
                                </p>
                            </div>
                            <Badge variant="default">Enabled</Badge>
                        </div>
                    </div>
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
                            <label className="text-sm font-medium">Language</label>
                            <div className="rounded-md border px-3 py-2">
                                <span>English (US)</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
