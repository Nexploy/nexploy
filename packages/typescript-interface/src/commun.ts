import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

export interface DropdownActionTool {
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
    label: string;
    onClick?: () => Promise<any> | void;
    separator?: boolean;
    disabled?: boolean;
}
