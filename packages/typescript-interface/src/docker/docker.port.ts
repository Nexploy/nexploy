type PortType = 'tcp' | 'udp' | 'sctp';

export interface PortFormProps {
    mode: 'add' | 'edit';
    defaultPort?: {
        publicPort: number;
        privatePort: number;
        type: PortType | string;
    };
}

export type ContainerPorts = {
    privatePort: number;
    publicPort: number;
    hostIps: string[];
    type: PortType | string;
};
