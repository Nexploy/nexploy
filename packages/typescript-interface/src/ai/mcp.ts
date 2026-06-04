export interface ToolContext {
    userId: string;
    role: string;
    requireConfirmation?: boolean;
    allowExecInContainer?: boolean;
    allowSwarmOperations?: boolean;
    allowImagesGroup?: boolean;
    allowVolumesGroup?: boolean;
    allowNetworksGroup?: boolean;
    allowComposeGroup?: boolean;
    allowRepositoriesGroup?: boolean;
    allowRegistriesGroup?: boolean;
    allowSslGroup?: boolean;
    allowEnvironmentsGroup?: boolean;
}
