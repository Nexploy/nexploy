import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { CommandGroup, CommandItem, CommandList } from '@workspace/ui/components/command';
import { Command as CommandPrimitive } from 'cmdk';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
export const InputAutoComplete = ({
    options = [],
    value = '',
    onChange,
    isLoading = false,
    placeholder,
    heading,
    alwaysShowOptions = false,
    ...props
}) => {
    const inputRef = useRef(null);
    const [isOpen, setOpen] = useState(false);
    const handleKeyDown = useCallback(
        (event) => {
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
        (selectedOption) => {
            onChange(selectedOption.value);
            setOpen(false);
            setTimeout(() => inputRef?.current?.blur(), 0);
        },
        [onChange],
    );
    const handleInputChange = (e) => {
        if (isLoading) return;
        onChange(e.target.value);
    };
    const filteredOptions = useMemo(() => {
        if (alwaysShowOptions) return options;
        const query = value.toLowerCase().trim();
        if (!query) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(query));
    }, [options, value, alwaysShowOptions]);
    const shouldShowList = alwaysShowOptions || (isOpen && (isLoading || filteredOptions.length > 0));
    return _jsx(PopoverPrimitive.Root, {
        open: shouldShowList,
        onOpenChange: setOpen,
        children: _jsxs(CommandPrimitive, {
            className: 'w-full',
            onKeyDown: handleKeyDown,
            children: [
                _jsx(PopoverPrimitive.Anchor, {
                    asChild: true,
                    children: _jsx(Input, {
                        ...props,
                        ref: inputRef,
                        type: 'text',
                        value: value,
                        onChange: handleInputChange,
                        onBlur: handleBlur,
                        onFocus: () => setOpen(true),
                        placeholder: placeholder,
                        readOnly: isLoading,
                        className: cn('text-base', props.className),
                    }),
                }),
                _jsx(PopoverPrimitive.Portal, {
                    children: _jsx(PopoverPrimitive.Content, {
                        onOpenAutoFocus: (e) => e.preventDefault(),
                        onInteractOutside: (e) => e.preventDefault(),
                        onWheel: (e) => e.stopPropagation(),
                        align: 'start',
                        sideOffset: 8,
                        style: { width: 'var(--radix-popper-anchor-width)' },
                        className: cn(
                            'bg-popover text-popover-foreground rounded-md border shadow-md outline-none',
                            'data-[state=open]:animate-in data-[state=closed]:animate-out',
                            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                            'z-50',
                        ),
                        children: _jsx(CommandList, {
                            children: isLoading
                                ? _jsx(CommandPrimitive.Loading, {
                                      children: _jsx('div', {
                                          className: 'space-y-2 p-2',
                                          children: Array.from({ length: 3 }).map((_, index) =>
                                              _jsx(Skeleton, { className: 'h-7 w-full' }, index),
                                          ),
                                      }),
                                  })
                                : _jsx(CommandGroup, {
                                      heading: heading,
                                      children: _jsx(ScrollAreaWithShadow, {
                                          className: 'flex max-h-60 flex-col overflow-y-auto',
                                          children: filteredOptions.map((option) =>
                                              _jsx(
                                                  CommandItem,
                                                  {
                                                      value: option.label,
                                                      onMouseDown: (event) => {
                                                          event.preventDefault();
                                                          event.stopPropagation();
                                                      },
                                                      onSelect: () => handleSelectOption(option),
                                                      className: cn('flex w-full items-center gap-2'),
                                                      children: option.label,
                                                  },
                                                  option.value,
                                              ),
                                          ),
                                      }),
                                  }),
                        }),
                    }),
                }),
            ],
        }),
    });
};
