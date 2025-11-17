'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Bell, Globe, Shield, User } from 'lucide-react';

export function AccountDetailsSection() {
    return (
        <div className="space-y-6 px-5">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="size-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>
                        Manage your personal information and account details
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <span>user_nexploy</span>
                                <Badge variant="secondary">Verified</Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <span>user@nexploy.com</span>
                                <Badge variant="outline">Primary</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline">Edit Profile</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="size-5" />
                        Security Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your account security and authentication preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <p className="font-medium">Two-Factor Authentication</p>
                                <p className="text-muted-foreground text-sm">
                                    Add an extra layer of security
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                Enable
                            </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <p className="font-medium">Password</p>
                                <p className="text-muted-foreground text-sm">
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

            <Card>
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

            <Card>
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
