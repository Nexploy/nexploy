export interface McpServerOptions {
    requireDestructiveConfirmation?: boolean;
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
    allowPipelineGroup?: boolean;
}

export interface ToolContext extends McpServerOptions {
    userId: string;
    role: string;
}
