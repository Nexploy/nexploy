'use client';

import React, { ComponentProps, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { type VariantProps } from 'class-variance-authority';

interface CopyButtonProps extends ComponentProps<'button'> {
    textToCopy: string;
}

export default function CopyButton({
    textToCopy,
    ...props
}: CopyButtonProps & VariantProps<typeof buttonVariants>) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Error clipboard: ', err);
        }
    };

    return (
        <Button {...props} onClick={handleCopy} variant={copied ? 'default' : 'outline'}>
            <span className="relative inline-flex items-center justify-center">
                <Copy
                    className={`size-[60%] transition-all duration-300 ${
                        copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                    }`}
                />
                <Check
                    className={`absolute left-1/2 w-[60%] -translate-x-1/2 transition-all duration-300 ${
                        copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                />
            </span>
        </Button>
    );
}
