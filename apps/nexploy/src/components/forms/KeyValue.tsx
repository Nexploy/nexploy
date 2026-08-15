import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { X } from 'lucide-react';

interface KeyValueInputProps {
    keyValue: string;
    value: string;
    onKeyChange: (val: string) => void;
    onValueChange: (val: string) => void;
    keyPlaceholder: string;
    valuePlaceholder: string;
}

interface KeyValueListProps {
    items: Record<string, string> | undefined;
    onRemove: (key: string) => void;
    title: string;
}

export function KeyValueInput({
    keyValue,
    value,
    onKeyChange,
    onValueChange,
    keyPlaceholder,
    valuePlaceholder,
}: KeyValueInputProps) {
    return (
        <div className="flex gap-2">
            <Input
                placeholder={keyPlaceholder}
                value={keyValue}
                onChange={(e) => onKeyChange(e.target.value)}
                className="flex-1"
            />
            <Input
                placeholder={valuePlaceholder}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className="flex-1"
            />
        </div>
    );
}

export function KeyValueList({ items, onRemove, title }: KeyValueListProps) {
    if (!items || Object.keys(items).length === 0) return null;

    return (
        <div className="space-y-2">
            <p className="font-medium text-sm">{title}</p>
            <div className="space-y-2">
                {Object.entries(items).map(([key, value]) => (
                    <div
                        key={key}
                        className="flex items-center justify-between rounded-md bg-muted p-1 px-2 transition-colors"
                    >
                        <code className="flex items-center gap-1">
                            <code className="rounded bg-background px-2 py-1 font-mono text-sm">{key}</code>
                            <span className="text-muted-foreground">=</span>
                            <code className="rounded bg-background px-2 py-1 font-mono text-sm">{value}</code>
                        </code>
                        <Button type="button" size="icon" variant="destructiveGhost" onClick={() => onRemove(key)}>
                            <X />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
