'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { LayoutGrid, Search } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { DockerHubSearchDialog } from '@/components/docker/image/pull/DockerHubSearchDialog.tsx';

export function SearchImages() {
    const t = useTranslations('docker.pullImagePage');
    const form = useFormContext();

    const selectedImage = form.watch('imageName');

    return (
        <Card className={'rounded-b-none border-b-0'}>
            <CardHeaderWithIcon
                icon={LayoutGrid}
                title={t('popularImages')}
                description={t('popularImagesDescription')}
            />
            <CardContent className={'overflow-hidden'}>
                <DockerHubSearchDialog
                    onSelect={(image) => form.setValue('imageName', `${image.slug}:latest`)}
                    isSelected={(image) => selectedImage === `${image.slug}:latest`}
                    trigger={
                        <Button type="button" variant="outline" className="w-full justify-start">
                            <Search className="size-4" />
                            {t('browseImages')}
                        </Button>
                    }
                />
            </CardContent>
        </Card>
    );
}
