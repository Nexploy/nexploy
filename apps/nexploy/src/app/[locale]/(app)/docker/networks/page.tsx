'use client';

import { EthernetPort } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { StatusDocker } from '@/components/docker/container/StatusDocker';
import { CardInfoNetworks } from '@/components/docker/network/CardInfoNetworks';
import { TableDockerNetworks } from '@/components/docker/network/table/TableDockerNetworks';
import { useNetworkStore } from '@/stores/docker/useNetworkStore';
import { useEffect } from 'react';

export default function NetworksPage() {
    const connect = useNetworkStore((state) => state.connect);
    const disconnect = useNetworkStore((state) => state.disconnect);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className={'flex gap-3 px-5'}>
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <EthernetPort className="text-primary size-7" />
                    </div>
                    <div className={'flex flex-col'}>
                        <div className={'flex items-center gap-3'}>
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                Docker Networks
                            </h1>
                            <StatusDocker className={'my-1'} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Gérez et visualisez tous vos réseaux Docker
                        </p>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className={'space-y-8 pb-6'}>
                        <CardInfoNetworks />
                        <TableDockerNetworks />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
