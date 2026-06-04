import type { AISuggestionCategory } from '@/hooks/useAIContext';
import { Button } from '@workspace/ui/components/button.tsx';

interface SuggestionsProps {
    categories: AISuggestionCategory[];
    onSelect: (text: string) => void;
}

export function Suggestions({ categories, onSelect }: SuggestionsProps) {
    return (
        <div className="flex flex-col gap-4 pt-2">
            {categories.map((category) => (
                <div key={category.id}>
                    <p className="text-muted-foreground mb-1.5 px-1 text-xs font-semibold tracking-wider uppercase">
                        {category.label}
                    </p>
                    <div className="flex flex-col gap-1">
                        {category.suggestions.map((text, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                className={
                                    'border-border bg-muted/40 hover:bg-muted h-fit w-full justify-start rounded-xl border px-3 py-2 text-left text-xs whitespace-normal transition-colors'
                                }
                                onClick={() => onSelect(text)}
                            >
                                {text}
                            </Button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
