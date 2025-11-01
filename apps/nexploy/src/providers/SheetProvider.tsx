'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@workspace/ui/components/sheet';
import { useSheetStore } from '@/stores/useSheetStore';
import { AddVolumeSheet } from '@/components/dialog/AddVolumeSheet';

export function SheetProvider() {
    const { isOpen, data, closeSheet } = useSheetStore();

    const renderContent = () => {
        if (!data) return null;

        if (data.content === 'ADD_VOLUME') {
            return <AddVolumeSheet />;
        }

        return data.content;
    };

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
                        <div className="mt-4">{renderContent()}</div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
