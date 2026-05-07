import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

export type TranslationFunction = (key: string, values?: Record<string, string | number>) => string;

export interface DropdownActionTool {
    icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
    label: string;
    onClick?: () => Promise<any> | void;
    separator?: boolean;
    disabled?: boolean;
}
