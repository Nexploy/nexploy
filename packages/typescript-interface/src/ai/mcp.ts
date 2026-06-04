export interface ToolContext {
    userId: string;
    role: string;
    requireConfirmation?: boolean;
    allowExecInContainer?: boolean;
    allowSwarmOperations?: boolean;
}
