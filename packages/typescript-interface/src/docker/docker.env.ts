export interface EnvFormProps {
    mode: 'add' | 'edit';
    defaultEnvVar?: Env;
    originalEnvVar?: Env;
}

export type Env = {
    key: string;
    value: string;
};

export interface EnvVarItemProps {
    env: Env;
    isEdited: boolean;
    isDeleted: boolean;
    isNew?: boolean;
    displayEnvVar: Env;
    onEdit?: (envVar: Env, originalEnvVar?: Env) => void;
    onCancelDelete?: () => void;
}
