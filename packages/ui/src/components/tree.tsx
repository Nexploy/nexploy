'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

type TreeContextValue = {
    expanded: Set<string>;
    toggle: (value: string) => void;
    selected?: string;
    onSelect?: (value: string) => void;
    indent: number;
};

const TreeContext = React.createContext<TreeContextValue | null>(null);

function useTreeContext() {
    const ctx = React.useContext(TreeContext);
    if (!ctx) throw new Error('Tree components must be used within <Tree>');
    return ctx;
}

const TreeDepthContext = React.createContext(0);

function Tree({
    value,
    onValueChange,
    defaultExpanded = [],
    indent = 14,
    className,
    children,
    ...props
}: Omit<React.ComponentProps<'div'>, 'onSelect'> & {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultExpanded?: string[];
    indent?: number;
}) {
    const [expanded, setExpanded] = React.useState(() => new Set(defaultExpanded));

    const toggle = React.useCallback((val: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(val)) next.delete(val);
            else next.add(val);
            return next;
        });
    }, []);

    const ctx = React.useMemo<TreeContextValue>(
        () => ({ expanded, toggle, selected: value, onSelect: onValueChange, indent }),
        [expanded, toggle, value, onValueChange, indent],
    );

    return (
        <TreeContext.Provider value={ctx}>
            <div role="tree" className={cn('flex flex-col gap-0.5', className)} {...props}>
                {children}
            </div>
        </TreeContext.Provider>
    );
}

function TreeItem({
    value,
    label,
    icon,
    actions,
    onSelect,
    className,
    children,
    ...props
}: Omit<React.ComponentProps<'div'>, 'onSelect'> & {
    value: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    onSelect?: (value: string) => void;
}) {
    const { expanded, toggle, selected, onSelect: ctxSelect, indent } = useTreeContext();
    const depth = React.useContext(TreeDepthContext);
    const hasChildren = React.Children.count(children) > 0;
    const isExpanded = expanded.has(value);
    const isSelected = selected === value;

    const handleClick = () => {
        if (hasChildren) toggle(value);
        onSelect?.(value);
        ctxSelect?.(value);
    };

    return (
        <div
            role="treeitem"
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={isSelected}
            {...props}
        >
            <div
                className={cn(
                    'group/tree-item flex w-full items-center gap-1.5 rounded-md py-1.5 pr-1.5 transition-colors',
                    isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted',
                    className,
                )}
                style={{ paddingLeft: depth * indent + 6 }}
            >
                <button
                    type="button"
                    onClick={handleClick}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                >
                    {hasChildren ? (
                        <ChevronRight
                            className={cn(
                                'size-3.5 shrink-0 opacity-60 transition-transform',
                                isExpanded && 'rotate-90',
                            )}
                        />
                    ) : (
                        <span className="size-3.5 shrink-0" />
                    )}
                    {icon}
                    <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
                </button>
                {actions}
            </div>
            {hasChildren && isExpanded && (
                <TreeDepthContext.Provider value={depth + 1}>
                    <div role="group" className="flex flex-col gap-0.5">
                        {children}
                    </div>
                </TreeDepthContext.Provider>
            )}
        </div>
    );
}

export { Tree, TreeItem };
