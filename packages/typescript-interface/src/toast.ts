export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
    type: ToastType;
    message: string;
    description?: string;
}

export type ToastItem = ToastData & {
    id: string;
    dismiss: () => Promise<void>;
};
