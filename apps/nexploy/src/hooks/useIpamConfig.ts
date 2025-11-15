import { useState } from 'react';

interface IpamConfig {
    subnet?: string;
    ipRange?: string;
    gateway?: string;
    auxAddress?: Record<string, string>;
}

export function useIpamConfig() {
    const [configs, setConfigs] = useState<IpamConfig[]>([]);
    const [subnet, setSubnet] = useState('');
    const [ipRange, setIpRange] = useState('');
    const [gateway, setGateway] = useState('');
    const [auxAddresses, setAuxAddresses] = useState<Record<string, string>>({});

    const addConfig = () => {
        if (
            !subnet.trim() &&
            !ipRange.trim() &&
            !gateway.trim() &&
            Object.keys(auxAddresses).length === 0
        ) {
            return null;
        }

        const newConfig: IpamConfig = {
            subnet: subnet.trim() || undefined,
            ipRange: ipRange.trim() || undefined,
            gateway: gateway.trim() || undefined,
            auxAddress: Object.keys(auxAddresses).length > 0 ? auxAddresses : undefined,
        };

        const newConfigs = [...configs, newConfig];
        setConfigs(newConfigs);
        setSubnet('');
        setIpRange('');
        setGateway('');
        setAuxAddresses({});

        return newConfigs;
    };

    const removeConfig = (index: number) => {
        const newConfigs = configs.filter((_, i) => i !== index);
        setConfigs(newConfigs);
        return newConfigs;
    };

    const addAuxAddress = (key: string, value: string) => {
        if (key.trim() && value.trim()) {
            setAuxAddresses({ ...auxAddresses, [key.trim()]: value.trim() });
        }
    };

    return {
        configs,
        subnet,
        ipRange,
        gateway,
        auxAddresses,
        setSubnet,
        setIpRange,
        setGateway,
        addConfig,
        removeConfig,
        addAuxAddress,
    };
}
