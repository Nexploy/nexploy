interface SuggestionsProps {
    suggestions: string[];
    onSelect: (text: string) => void;
}

export function Suggestions({ suggestions, onSelect }: SuggestionsProps) {
    return (
        <div className="pt-2">
            <p className="text-muted-foreground mb-2 px-1 text-xs font-semibold uppercase tracking-wider">
                Suggestions
            </p>
            <div className="flex flex-col gap-1.5">
                {suggestions.map((text, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(text)}
                        className="border-border bg-muted/40 hover:bg-muted w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors"
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
