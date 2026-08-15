'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@workspace/ui/components/command';
import { Popover, PopoverAnchor, PopoverContent } from '@workspace/ui/components/popover';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';

const SKELETON_ROWS = [0, 1, 2];

export interface AutocompleteOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface AutocompleteProps {
    options: AutocompleteOption[];
    inputValue: string;
    onInputValueChange: (value: string) => void;
    value?: string;
    onValueChange?: (value: string, option: AutocompleteOption) => void;
    placeholder?: string;
    emptyMessage?: string;
    isLoading?: boolean;
    disabled?: boolean;
    minQueryLength?: number;
    className?: string;
    inputClassName?: string;
    autoFocus?: boolean;
    name?: string;
    onBlur?: () => void;
}

export function Autocomplete({
    options,
    inputValue,
    onInputValueChange,
    value,
    onValueChange,
    placeholder,
    emptyMessage,
    isLoading = false,
    disabled = false,
    minQueryLength = 0,
    className,
    inputClassName,
    autoFocus,
    name,
    onBlur,
}: AutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleSelect = (option: AutocompleteOption) => {
        onInputValueChange(option.label);
        onValueChange?.(option.value, option);
        setOpen(false);
    };

    const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        if (containerRef.current?.contains(event.relatedTarget as Node | null)) return;
        setOpen(false);
        onBlur?.();
    };

    const hasMinQuery = inputValue.trim().length >= minQueryLength;
    const showList = open && !disabled && hasMinQuery;

    return (
        <div ref={containerRef} className={cn('relative', className)} onBlur={handleBlur}>
            <Command shouldFilter={false} loop className="overflow-visible bg-transparent">
                <Popover open={showList} onOpenChange={setOpen}>
                    <PopoverAnchor asChild>
                        <div
                            data-slot="autocomplete-input-wrapper"
                            className={cn(
                                'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 shadow-xs transition-[color,box-shadow] dark:bg-input/30',
                                'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                                disabled && 'cursor-not-allowed opacity-50',
                            )}
                        >
                            <CommandPrimitive.Input
                                data-slot="autocomplete-input"
                                name={name}
                                value={inputValue}
                                onValueChange={(next) => {
                                    onInputValueChange(next);
                                    setOpen(true);
                                }}
                                onFocus={() => setOpen(true)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Escape') setOpen(false);
                                }}
                                placeholder={placeholder}
                                disabled={disabled}
                                autoFocus={autoFocus}
                                className={cn(
                                    'w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed',
                                    inputClassName,
                                )}
                            />
                            {isLoading && <Spinner className="size-4 shrink-0 text-muted-foreground" />}
                        </div>
                    </PopoverAnchor>

                    <PopoverContent
                        align="start"
                        sideOffset={4}
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onInteractOutside={(event) => {
                            if (containerRef.current?.contains(event.target as Node | null)) event.preventDefault();
                        }}
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                    >
                        <CommandList className="max-h-56">
                            {isLoading ? (
                                <div className="space-y-1 p-1">
                                    {SKELETON_ROWS.map((row) => (
                                        <div key={row} className="flex items-center gap-2 px-2 py-1.5">
                                            <Skeleton className="size-6 shrink-0 rounded-md" />
                                            <div className="flex w-full flex-col gap-1">
                                                <Skeleton className="h-3 w-3/5" />
                                                <Skeleton className="h-2.5 w-1/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <CommandEmpty className="py-6 text-center text-muted-foreground text-sm">
                                    {emptyMessage}
                                </CommandEmpty>
                            )}
                            <CommandGroup className={cn(isLoading && 'hidden')}>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onSelect={() => handleSelect(option)}
                                        className="cursor-pointer gap-2"
                                    >
                                        {option.icon}
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm">{option.label}</span>
                                            {option.description && (
                                                <span className="truncate text-muted-foreground text-xs">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                        {value === option.value && <CheckIcon className="ml-auto size-4" />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </PopoverContent>
                </Popover>
            </Command>
        </div>
    );
}
