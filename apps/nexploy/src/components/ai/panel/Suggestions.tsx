import type { AISuggestionCategory } from '@/hooks/useAIContext';

interface SuggestionsProps {
    categories: AISuggestionCategory[];
    onSelect: (text: string) => void;
}

export function Suggestions({ categories, onSelect }: SuggestionsProps) {
    return (
        <div className="flex flex-col gap-4 pt-2">
            {categories.map((category) => (
                <div key={category.id}>
                    <p className="text-muted-foreground mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider">
                        {category.label}
                    </p>
                    <div className="flex flex-col gap-1">
                        {category.suggestions.map((text, i) => (
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
            ))}
        </div>
    );
}
