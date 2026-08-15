import type { AISuggestionCategory } from '@/hooks/useAIContext';
import { Button } from '@workspace/ui/components/button';

interface SuggestionsProps {
    categories: AISuggestionCategory[];
    onSelect: (text: string) => void;
}

export function Suggestions({ categories, onSelect }: SuggestionsProps) {
    return (
        <div className="flex flex-col gap-4 pt-2">
            {categories.map((category) => (
                <div key={category.id}>
                    <p className="mb-1.5 px-1 text-muted-foreground text-xs">{category.label}</p>
                    <div className="flex flex-col gap-1">
                        {category.suggestions.map((text, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                className={
                                    'h-fit w-full justify-start whitespace-normal rounded-xl border border-border bg-muted/40 px-3 py-2 text-left text-xs transition-colors hover:bg-muted'
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
