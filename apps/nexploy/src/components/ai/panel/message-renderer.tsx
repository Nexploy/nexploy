'use client';

import React, { useMemo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@workspace/ui/lib/utils';

interface MessageRendererProps {
    text: string;
    isStreaming?: boolean;
}

type Blur = (children: React.ReactNode) => React.ReactNode;

function processBlurChildren(nodes: React.ReactNode) {
    return React.Children.map(nodes, (child, i) => {
        if (typeof child !== 'string') return child;
        return child.split(/(\s+)/).map((seg, j) =>
            /^\s+$/.test(seg) ? (
                seg
            ) : (
                <span key={`w-${i}-${j}`} className="blur-word">
                    {seg}
                </span>
            ),
        );
    });
}

function makeComponents(blur: Blur): Components {
    return {
        p: ({ children }) => <p className="wrap-break-word mb-1.5 last:mb-0">{blur(children)}</p>,
        strong: ({ children }) => <strong className="font-semibold">{blur(children)}</strong>,
        em: ({ children }) => <em className="italic">{blur(children)}</em>,
        h1: ({ children }) => (
            <h1 className="wrap-break-word mb-1 mt-2 text-sm font-bold first:mt-0">
                {blur(children)}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 className="wrap-break-word mb-1 mt-2 text-xs font-bold first:mt-0">
                {blur(children)}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 className="wrap-break-word mb-1 mt-1.5 text-xs font-semibold first:mt-0">
                {blur(children)}
            </h3>
        ),
        ul: ({ children }) => <ul className="mb-1.5 ml-3 list-disc space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-1.5 ml-3 list-decimal space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="wrap-break-word">{children}</li>,
        code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            return isBlock ? (
                <code
                    className={cn('block whitespace-pre-wrap break-all text-xs', className)}
                    {...props}
                >
                    {children}
                </code>
            ) : (
                <code
                    className="bg-background/80 break-all rounded px-1.5 py-0.5 font-mono"
                    {...props}
                >
                    {children}
                </code>
            );
        },
        pre: ({ children }) => (
            <pre className="bg-background/80 my-2 overflow-x-hidden whitespace-pre-wrap break-all rounded border p-2.5 font-mono text-xs leading-relaxed">
                {children}
            </pre>
        ),
        table: ({ children }) => <table className="break-all text-[11px]">{children}</table>,
        thead: ({ children }) => <thead className="border-border/50 border-b">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
            <tr className="border-border/30 border-b last:border-0">{children}</tr>
        ),
        th: ({ children }) => <th className="px-2 py-1 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="wrap-break-word px-2 py-1">{blur(children)}</td>,
        hr: () => <hr className="border-border/40 my-2" />,
        blockquote: ({ children }) => (
            <blockquote className="border-border text-muted-foreground my-1.5 break-all border-l-2 pl-2.5">
                {blur(children)}
            </blockquote>
        ),
        a: ({ href, children }) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline underline-offset-2 hover:opacity-80"
            >
                {blur(children)}
            </a>
        ),
    };
}

export function RenderMessageText({ text, isStreaming }: MessageRendererProps) {
    const components = useMemo(
        () => (isStreaming ? makeComponents(processBlurChildren) : makeComponents((c) => c)),
        [isStreaming],
    );

    return (
        <>
            {isStreaming && (
                <style>{`
                    @keyframes blurIn {
                        from { opacity: 0; filter: blur(7px); }
                        to   { opacity: 1; filter: blur(0);   }
                    }
                    .blur-word {
                        display: inline-block;
                        animation: blurIn 0.5s ease forwards;
                    }
                `}</style>
            )}
            <div className="w-full min-w-0 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {text}
                </ReactMarkdown>
            </div>
        </>
    );
}
