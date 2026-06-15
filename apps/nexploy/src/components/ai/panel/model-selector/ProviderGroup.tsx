'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { Check } from 'lucide-react';
import { CommandGroup, CommandItem } from '@workspace/ui/components/command';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { cn } from '@workspace/ui/lib/utils';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { ModelOption, Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { useAIPanelStore } from '@/stores/useAIPanelStore';
import { PROVIDER_META } from '@/components/ai/providerMeta';

interface ProviderGroupProps {
    provider: Provider;
    label: string;
    onSettled?: (provider: Provider) => void;
}

export function ProviderGroup({ provider, label, onSettled }: ProviderGroupProps) {
    const selected = useAIPanelStore((s) => s.selectedModel);
    const setSelectedModel = useAIPanelStore((s) => s.setSelectedModel);
    const closeModelSelector = useAIPanelStore((s) => s.closeModelSelector);

    const { data, isLoading } = useSWR<{ models: ModelOption[] }>(
        { url: `/api/ai/models/${provider}` },
        fetcherApi,
        { errorRetryCount: 0 },
    );

    useEffect(() => {
        if (!isLoading) onSettled?.(provider);
    }, [provider, isLoading, onSettled]);

    const models = data?.models ?? [];
    const { icon: Icon, color } = PROVIDER_META[provider];

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
                              onSelect={() => {
                                  setSelectedModel({ provider, modelId: m.value, label: m.label });
                                  closeModelSelector();
                              }}
                              className="gap-3 py-2.5"
                          >
                              <span
                                  className={cn(
                                      'flex size-7 shrink-0 items-center justify-center rounded-md',
                                      color,
                                  )}
                              >
                                  <Icon className="size-4 shrink-0" />
                              </span>
                              <span className="flex-1 truncate">{m.label}</span>
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
