export type PortType = 'tcp' | 'udp' | 'sctp';

export type ContainerPortForm = {
    publicPort: string | number | undefined;
    privatePort: string | number;
    type: PortType;
};

export interface PortFormProps {
    mode: 'add' | 'edit';
    originalPort?: {
        publicPort?: number;
        privatePort: number;
        type: PortType;
    };
    defaultPort?: {
        publicPort?: number;
        privatePort: number;
        type: PortType;
    };
}

export type ContainerPorts = {
    privatePort: number;
    publicPort: number;
    hostIps: string[];
    type: PortType;
};
