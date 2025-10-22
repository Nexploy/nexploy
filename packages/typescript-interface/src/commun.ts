export interface DropdownActionTool {
    icon: any;
    label: string;
    action?: () => Promise<void> | void;
    separator?: boolean;
}
