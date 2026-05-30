'use client';

import useSWR from 'swr';
import { Check } from 'lucide-react';
import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { cn } from '@workspace/ui/lib/utils';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { ModelOption, Provider, SelectedModel, } from '@workspace/typescript-interface/ai/aiConfig';

interface ProviderGroupProps {
    provider: Provider;
    label: string;
    selected: SelectedModel | null;
    onSelect: (m: SelectedModel) => void;
}

export function ProviderGroup({ provider, label, selected, onSelect }: ProviderGroupProps) {
    const { data, isLoading } = useSWR<{ models: ModelOption[] }>(
        { url: `/api/ai/models/${provider}` },
        fetcherApi,
        { errorRetryCount: 0 },
    );

    const models = data?.models ?? [];

    if (!isLoading && models.length === 0) return null;

    return (
        <CommandGroup heading={label}>
            {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-2 py-2">
                          <Skeleton className="size-6 rounded-full" />
                          <Skeleton className="h-4 w-40" />
                      </div>
                  ))
                : models.map((m) => {
                      const isSelected =
                          selected?.provider === provider && selected.modelId === m.value;

                      return (
                          <CommandItem
                              key={m.value}
                              value={`${m.label} ${m.value}`}
                              onSelect={() =>
                                  onSelect({ provider, modelId: m.value, label: m.label })
                              }
                              className="gap-3 py-2.5"
                          >
                              <span className="flex-1">{m.label}</span>
                              <Check
                                  className={cn(
                                      'size-4 shrink-0',
                                      isSelected ? 'text-primary opacity-100' : 'opacity-0',
                                  )}
                              />
                          </CommandItem>
                      );
                  })}
        </CommandGroup>
    );
}
