'use client';

import * as React from 'react';
import { File as FileIcon, Upload, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

interface DragAndDropProps {
    onFileContent?: (content: string, fileName: string) => void;
    onFile?: (file: File | null) => void;
    accept?: string[];
    dropText?: string;
    formatsText?: string;
    disabled?: boolean;
    className?: string;
}

function DragAndDrop({
    onFileContent,
    onFile,
    accept,
    dropText = 'Drag & drop a file here, or click to browse',
    formatsText,
    disabled,
    className,
}: DragAndDropProps) {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [fileName, setFileName] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const processFile = React.useCallback(
        (file: File) => {
            setFileName(file.name);
            onFile?.(file);

            if (!onFileContent) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                onFileContent(e.target?.result as string, file.name);
            };
            reader.readAsText(file);
        },
        [onFileContent, onFile],
    );

    const handleDrop = React.useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        },
        [processFile],
    );

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleFileInputChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
        },
        [processFile],
    );

    const handleClear = React.useCallback(() => {
        setFileName(null);
        onFile?.(null);
        onFileContent?.('', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onFileContent, onFile]);

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
                'relative rounded-lg border-2 border-dashed transition-colors',
                isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                disabled && 'pointer-events-none opacity-50',
                className,
            )}
        >
            {!fileName ? (
                <div
                    className="flex cursor-pointer flex-col items-center gap-2 p-4"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-center text-muted-foreground text-xs">{dropText}</p>
                    {formatsText && <p className="text-center text-muted-foreground/60 text-xs">{formatsText}</p>}
                </div>
            ) : (
                <div className="flex items-center gap-2 p-3">
                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-muted-foreground text-xs">{fileName}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={handleClear}
                        disabled={disabled}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept?.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
            />
        </div>
    );
}

export { DragAndDrop };
export type { DragAndDropProps };
