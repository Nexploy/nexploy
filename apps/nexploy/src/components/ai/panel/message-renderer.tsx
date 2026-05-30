import React from 'react';

export function renderInlineText(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const inlineCodeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(
                <span key={key++} className="whitespace-pre-wrap">
                    {text.slice(lastIndex, match.index)}
                </span>,
            );
        }
        parts.push(
            <code key={key++} className="bg-background/80 rounded px-1 py-0.5 font-mono text-xs">
                {match[1]}
            </code>,
        );
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(
            <span key={key++} className="whitespace-pre-wrap">
                {text.slice(lastIndex)}
            </span>,
        );
    }

    return parts;
}

export function renderMessageText(text: string): React.ReactNode[] {
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(
                <span key={key++}>{renderInlineText(text.slice(lastIndex, match.index))}</span>,
            );
        }
        parts.push(
            <pre
                key={key++}
                className="bg-background/80 my-2 overflow-x-auto rounded border p-2.5 font-mono text-xs leading-relaxed"
            >
                <code>{match[2]?.trim()}</code>
            </pre>,
        );
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{renderInlineText(text.slice(lastIndex))}</span>);
    }

    return parts;
}
