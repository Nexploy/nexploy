import { HardDrive } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { StatusDocker } from '@/components/docker/StatusDocker';
import { CardInfoVolumes } from '@/components/docker/volume/CardInfoVolumes';
import { TableDockerVolumes } from '@/components/docker/volume/table/TableDockerVolumes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Docker Volumes',
    description: 'Gérez et visualisez tous vos volumes Docker avec Nexploy',
};

export default function VolumesPage() {
    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <HardDrive className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <div className={'flex items-center gap-3'}>
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                Docker Volumes
                            </h1>
                            <StatusDocker className={'my-1'} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Gérez et visualisez tous vos volumes Docker
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'space-y-8 pb-6'}>
                        <CardInfoVolumes />
                        <TableDockerVolumes />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
