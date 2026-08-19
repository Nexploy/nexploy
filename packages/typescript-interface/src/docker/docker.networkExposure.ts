export interface PubliclyExposedPort {
    publicPort: number;
    privatePort: number;
    type: string;
}

export interface PubliclyExposedContainer {
    id: string;
    name: string;
    ports: PubliclyExposedPort[];
}
