import { CommandGroup, CommandItem, CommandList } from '@workspace/ui/components/command';
import { Command as CommandPrimitive } from 'cmdk';
import * as React from 'react';
import { type KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';

import { Skeleton } from '@workspace/ui/components/skeleton';
import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

export type InputAutoCompleteOption = Record<'value' | 'label', string> & Record<string, string>;

type InputAutoCompleteProps = {
    options?: InputAutoCompleteOption[];
    value?: string;
    onChange?: (value: string) => void;
    isLoading?: boolean;
    placeholder?: string;
    heading?: string;
};

export const InputAutoComplete = ({
    options = [],
    value = '',
    onChange,
    isLoading = false,
    placeholder,
    heading,
    ...props
}: InputAutoCompleteProps & React.ComponentProps<'input'>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setOpen] = useState(false);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current;
            if (!input) return;

            if (event.key === 'Enter' && input.value !== '') {
                const optionToSelect = options.find((option) => option.label === input.value);
                if (optionToSelect) {
                    onChange?.(optionToSelect.value);
                }
            }

            if (event.key === 'Escape') {
                input.blur();
            }
        },
        [options, onChange],
    );

    const handleBlur = useCallback(() => {
        setOpen(false);
    }, []);

    const handleSelectOption = useCallback(
        (selectedOption: InputAutoCompleteOption) => {
            onChange?.(selectedOption.value);
            setTimeout(() => inputRef?.current?.blur(), 0);
        },
        [onChange],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLoading) return;
        onChange?.(e.target.value);
    };

    const filteredOptions = useMemo(() => {
        const query = value.toLowerCase().trim();
        if (!query) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(query));
    }, [options, value]);

    const shouldShowList = isOpen && (isLoading || filteredOptions.length > 0);

    return (
        <CommandPrimitive onKeyDown={handleKeyDown}>
            <Input
                {...props}
                ref={inputRef}
                value={value}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                readOnly={isLoading}
                className="text-base"
            />

            {shouldShowList && (
                <div className="relative">
                    <div
                        data-state={isOpen ? 'open' : 'closed'}
                        className={cn(
                            'bg-popover text-popover-foreground absolute top-0 z-50 mt-2 w-full rounded-md border shadow-md outline-none',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
                            isOpen ? 'block' : 'hidden',
                        )}
                    >
                        <CommandList>
                            {isLoading ? (
                                <CommandPrimitive.Loading>
                                    <div className="space-y-2 p-2">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <Skeleton key={index} className="h-7 w-full" />
                                        ))}
                                    </div>
                                </CommandPrimitive.Loading>
                            ) : (
                                <CommandGroup heading={heading}>
                                    <ScrollArea className="flex max-h-60 flex-col overflow-y-auto">
                                        {filteredOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                }}
                                                onSelect={() => handleSelectOption(option)}
                                                className={cn('flex w-full items-center gap-2')}
                                            >
                                                {option.label}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </div>
                </div>
            )}
        </CommandPrimitive>
    );
};
