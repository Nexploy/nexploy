export interface AISettingsUpdate {
    aiEnabled?: boolean;
    mcpEnabled?: boolean;
    requireDestructiveConfirmation?: boolean;
    maxSteps?: number;
    customSystemPrompt?: string | null;
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
