export interface DropdownActionTool {
    icon: any;
    label: string;
    action?: () => Promise<any> | void;
    separator?: boolean;
}
