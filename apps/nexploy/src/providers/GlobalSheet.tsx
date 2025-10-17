'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from '@workspace/ui/components/sheet';
import { useSheetStore } from '@/stores/useSheetStore';

export function GlobalSheet() {
    const { isOpen, data, closeSheet } = useSheetStore();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeSheet()}>
            <SheetContent side={data?.side || 'right'} className="sm:max-w-2/5">
                {data && (
                    <>
                        <SheetHeader>
                            <SheetTitle>{data.title}</SheetTitle>
                            {data.description && (
                                <SheetDescription>{data.description}</SheetDescription>
                            )}
                        </SheetHeader>
                        <div className="mt-4">
                            {data.content}
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
