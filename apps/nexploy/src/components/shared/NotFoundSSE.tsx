'use client';

import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@workspace/ui/components/empty.tsx';

interface NotFoundSSEProps {
    title: string;
    description: string;
    backLabel: string;
}

export function NotFoundSSE({ title, description, backLabel }: NotFoundSSEProps) {
    const router = useRouter();

    return (
        <BreadcrumbProvider segments={{}}>
            <div className="flex h-full flex-1 flex-col items-center justify-center">
                <Empty className="mb-24">
                    <EmptyHeader>
                        <EmptyMedia variant="icon" className="bg-destructive/10">
                            <AlertCircle className="text-destructive" />
                        </EmptyMedia>
                        <EmptyTitle>{title}</EmptyTitle>
                        <EmptyDescription>{description}</EmptyDescription>
                    </EmptyHeader>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" />
                        {backLabel}
                    </Button>
                </Empty>
            </div>
        </BreadcrumbProvider>
    );
}
