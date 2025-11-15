export interface EnvFormProps {
    mode: 'add' | 'edit';
    defaultEnvVar?: Env;
    originalEnvVar?: Env;
}

export type Env = {
    key: string;
    value: string;
};
