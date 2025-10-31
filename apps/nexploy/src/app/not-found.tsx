'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-4 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="cursor-help self-center text-5xl font-bold tracking-tighter transition-transform hover:scale-110">
                    404
                </h1>
                <span className="text-muted-foreground">
                    Oops! Wrong turn. Head back to where you came from.
                </span>
            </div>
            <Button onClick={() => router.back()} variant="default">
                <ArrowLeft className="mr-2" />
                Back
            </Button>
        </div>
    );
}
