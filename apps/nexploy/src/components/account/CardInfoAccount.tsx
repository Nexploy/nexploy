'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Calendar, Settings, Shield, User } from 'lucide-react';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function CardInfoAccount() {
    const isLoading = false;

    const accountInfos = [
        {
            title: 'Profile',
            icon: User,
            content: 'Active',
            description: 'Your account is fully active',
        },
        {
            title: 'Member Since',
            icon: Calendar,
            content: '2024',
            description: 'Year you joined Nexploy',
        },
        {
            title: 'Account Type',
            icon: Shield,
            content: 'Premium',
            description: 'Full access to all features',
        },
        {
            title: 'Settings',
            icon: Settings,
            content: 'Configured',
            description: 'Your preferences are set',
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 gap-5 px-5 md:grid-cols-4">
                {accountInfos.map((info, index) =>
                    isLoading ? (
                        <Skeleton key={index} className="rounded-xl py-19" />
                    ) : (
                        <Card key={index} className="flex flex-col justify-between gap-0 py-6">
                            <CardHeader className="flex flex-row justify-between space-y-0">
                                <CardTitle className="flex h-14 text-sm font-medium">
                                    {info.title}
                                </CardTitle>
                                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                    <info.icon className="text-primary size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">{info.content}</div>
                                <p className="text-muted-foreground text-xs">{info.description}</p>
                            </CardContent>
                        </Card>
                    ),
                )}
            </div>
        </>
    );
}
