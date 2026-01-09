export type BindMountClassification = 'code' | 'data' | 'unknown';

export interface ParsedBindMount {
    serviceName: string;
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
    absoluteHostPath: string;
    exists: boolean;
    classification: BindMountClassification;
    classificationReason: string;
}

export type TransformStrategy = 'copy_to_image' | 'named_volume' | 'remove';

export interface BindMountTransformation {
    serviceName: string;
    originalMount: ParsedBindMount;
    strategy: TransformStrategy;
    volumeName?: string;
    generatedDockerfile?: string;
    warningMessage?: string;
}

export interface VolumeTransformationResult {
    transformations: BindMountTransformation[];
    modifiedComposeContent: unknown;
    generatedDockerfiles: Map<string, string>;
    volumesToCreate: string[];
    warnings: string[];
}

export interface ComposeVolumeConfig {
    type?: 'bind' | 'volume' | 'tmpfs';
    source: string;
    target: string;
    read_only?: boolean;
}
