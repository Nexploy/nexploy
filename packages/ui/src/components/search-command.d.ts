import * as React from 'react';
export type InputAutoCompleteOption = Record<'value' | 'label', string> & Record<string, string>;
type InputAutoCompleteProps = {
    options?: InputAutoCompleteOption[];
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    placeholder?: string;
    heading?: string;
    alwaysShowOptions?: boolean;
};
export declare const InputAutoComplete: ({
    options,
    value,
    onChange,
    isLoading,
    placeholder,
    heading,
    alwaysShowOptions,
    ...props
}: InputAutoCompleteProps & Omit<React.ComponentProps<'input'>, 'onChange'>) => import('react/jsx-runtime').JSX.Element;
export {};
