import { CommandGroup, CommandItem, CommandList } from '@workspace/ui/components/command';
import { Command as CommandPrimitive } from 'cmdk';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';
import { type KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';

import { Skeleton } from '@workspace/ui/components/skeleton';
import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

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

export const InputAutoComplete = ({
    options = [],
    value = '',
    onChange,
    isLoading = false,
    placeholder,
    heading,
    alwaysShowOptions = false,
    ...props
}: InputAutoCompleteProps & Omit<React.ComponentProps<'input'>, 'onChange'>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setOpen] = useState(false);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current;
            if (!input) return;

            if (event.key === 'Enter' && input.value !== '') {
                const optionToSelect = options.find((option) => option.label === input.value);
                if (optionToSelect) {
                    onChange(optionToSelect.value);
                    setOpen(false);
                }
            }

            if (event.key === 'Escape') {
                input.blur();
                setOpen(false);
            }
        },
        [options, onChange],
    );

    const handleBlur = useCallback(() => {
        setOpen(false);
    }, []);

    const handleSelectOption = useCallback(
        (selectedOption: InputAutoCompleteOption) => {
            onChange(selectedOption.value);
            setOpen(false);
            setTimeout(() => inputRef?.current?.blur(), 0);
        },
        [onChange],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLoading) return;
        onChange(e.target.value);
    };

    const filteredOptions = useMemo(() => {
        if (alwaysShowOptions) return options;
        const query = value.toLowerCase().trim();
        if (!query) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(query));
    }, [options, value, alwaysShowOptions]);

    const shouldShowList =
        alwaysShowOptions || (isOpen && (isLoading || filteredOptions.length > 0));

    return (
        <PopoverPrimitive.Root open={shouldShowList} onOpenChange={setOpen}>
            <CommandPrimitive onKeyDown={handleKeyDown}>
                <PopoverPrimitive.Anchor asChild>
                    <Input
                        {...props}
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        readOnly={isLoading}
                        className={cn('text-base', props.className)}
                    />
                </PopoverPrimitive.Anchor>
                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                        onWheel={(e) => e.stopPropagation()}
                        align="start"
                        sideOffset={8}
                        style={{ width: 'var(--radix-popper-anchor-width)' }}
                        className={cn(
                            'bg-popover text-popover-foreground rounded-md border shadow-md outline-none',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                            'z-50',
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
                                    <ScrollAreaWithShadow
                                        colorShadow={'from-popover via-popover/50'}
                                        className="flex max-h-60 flex-col overflow-y-auto"
                                    >
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
                                    </ScrollAreaWithShadow>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </CommandPrimitive>
        </PopoverPrimitive.Root>
    );
};
