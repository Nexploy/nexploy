'use client';

import useSWR from 'swr';
import { Check, Eye, Globe, Wrench, Zap } from 'lucide-react';
import {
    CommandGroup,
    CommandItem,
} from '@workspace/ui/components/command';
import { cn } from '@workspace/ui/lib/utils';
import { fetcherApi } from '@/lib/api/fetcherApi';
import type { AIProvider, Capability, ModelOption, SelectedModel } from '@workspace/typescript-interface/ai/aiConfig';

const CAPABILITY_ICONS: Record<Capability, React.ReactNode> = {
    vision: <Eye className="size-2.5" />,
    tools: <Wrench className="size-2.5" />,
    fast: <Zap className="size-2.5" />,
    web: <Globe className="size-2.5" />,
};

const MODEL_CAPABILITIES: Record<string, Capability[]> = {
    'gpt-4o': ['vision', 'tools', 'web'],
    'gpt-4o-mini': ['vision', 'tools', 'fast'],
    o1: ['tools'],
    'o1-mini': ['fast'],
    o3: ['tools', 'web'],
    'o3-mini': ['fast', 'tools'],
    'claude-opus-4-5': ['vision', 'tools'],
    'claude-sonnet-4-5': ['vision', 'tools', 'fast'],
    'claude-haiku-4-5': ['vision', 'tools', 'fast'],
    'claude-3-5-sonnet-20241022': ['vision', 'tools'],
    'claude-3-5-haiku-20241022': ['vision', 'tools', 'fast'],
    'claude-3-opus-20240229': ['vision', 'tools'],
    'gemini-2.0-flash': ['vision', 'tools', 'fast', 'web'],
    'gemini-2.0-flash-lite': ['vision', 'fast'],
    'gemini-1.5-pro': ['vision', 'tools', 'web'],
    'gemini-1.5-flash': ['vision', 'tools', 'fast'],
};

function getCapabilities(modelId: string): Capability[] {
    const exact = MODEL_CAPABILITIES[modelId];
    if (exact) return exact;
    const lower = modelId.toLowerCase();
    const caps: Capability[] = [];
    if (lower.includes('vision') || lower.includes('vl')) caps.push('vision');
    if (lower.includes('mini') || lower.includes('flash') || lower.includes('haiku'))
        caps.push('fast');
    return caps;
}

interface ProviderGroupProps {
    provider: AIProvider;
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
                          <div className="bg-muted size-6 animate-pulse rounded-full" />
                          <div className="bg-muted h-4 w-40 animate-pulse rounded" />
                      </div>
                  ))
                : models.map((m) => {
                      const isSelected =
                          selected?.provider === provider && selected.modelId === m.value;
                      const caps = getCapabilities(m.value);

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
                              <div className="flex items-center gap-1">
                                  {caps.map((cap) => (
                                      <span
                                          key={cap}
                                          className="bg-muted text-muted-foreground inline-flex size-5 items-center justify-center rounded-full"
                                      >
                                          {CAPABILITY_ICONS[cap]}
                                      </span>
                                  ))}
                              </div>
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
