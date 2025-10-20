import { ToastT } from 'sonner';

export function isToastT(t: any): t is ToastT {
    return t && 'type' in t;
}
