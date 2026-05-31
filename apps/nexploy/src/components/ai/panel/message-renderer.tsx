'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@workspace/ui/lib/utils';

interface MessageRendererProps {
    text: string;
}

export function RenderMessageText({ text }: MessageRendererProps) {
    return (
        <div className="w-full min-w-0 overflow-x-hidden leading-relaxed break-all">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mb-1.5 break-words last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    h1: ({ children }) => (
                        <h1 className="mt-2 mb-1 text-sm font-bold break-words first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mt-2 mb-1 text-xs font-bold break-words first:mt-0">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mt-1.5 mb-1 text-xs font-semibold break-words first:mt-0">
                            {children}
                        </h3>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-1.5 ml-3 list-disc space-y-0.5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-1.5 ml-3 list-decimal space-y-0.5">{children}</ol>
                    ),
                    li: ({ children }) => <li className="break-words">{children}</li>,
                    code: ({ className, children, ...props }) => {
                        const isBlock = className?.includes('language-');
                        if (isBlock) {
                            return (
                                <code
                                    className={cn(
                                        'block text-xs break-all whitespace-pre-wrap',
                                        className,
                                    )}
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code
                                className="bg-background/80 rounded px-1.5 py-0.5 font-mono break-all"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="bg-background/80 my-2 w-full overflow-x-auto rounded border p-2.5 font-mono text-xs leading-relaxed">
                            {children}
                        </pre>
                    ),
                    table: ({ children }) => (
                        <div className="my-2 min-w-0 overflow-x-auto">
                            <table className="min-w-full border-collapse text-[11px]">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="border-border/50 border-b">{children}</thead>
                    ),
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => (
                        <tr className="border-border/30 border-b last:border-0">{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-2 py-1 text-left font-semibold">{children}</th>
                    ),
                    td: ({ children }) => <td className="px-2 py-1 break-words">{children}</td>,
                    hr: () => <hr className="border-border/40 my-2" />,
                    blockquote: ({ children }) => (
                        <blockquote className="border-border text-muted-foreground my-1.5 border-l-2 pl-2.5">
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:opacity-80"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}
