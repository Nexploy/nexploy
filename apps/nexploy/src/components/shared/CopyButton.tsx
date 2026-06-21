'use client';

import React, { ComponentProps, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { type VariantProps } from 'class-variance-authority';

interface CopyButtonProps extends ComponentProps<'button'> {
    text: string;
}

export default function CopyButton({
    text,
    ...props
}: CopyButtonProps & VariantProps<typeof buttonVariants>) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Error clipboard: ', err);
        }
    };

    return (
        <Button
            {...props}
            onClick={handleCopy}
            variant={copied ? 'default' : (props.variant ?? 'outline')}
        >
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
