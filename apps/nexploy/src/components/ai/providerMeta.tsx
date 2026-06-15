import type { ComponentType, SVGProps } from 'react';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import Openai from '@thesvg/react/openai';
import Anthropic from '@thesvg/react/anthropic';
import Gemini from '@thesvg/react/gemini';
import Openrouter from '@thesvg/react/openrouter';
import Groq from '@thesvg/react/groq';
import Perplexity from '@thesvg/react/perplexity';
import { Grok, Mistral } from '@thesvg/react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface ProviderMeta {
    icon: IconComponent;
    /** Tailwind background color class used behind the provider icon. */
    color: string;
}

/** Single source of truth for provider icons and brand background colors. */
export const PROVIDER_META: Record<Provider, ProviderMeta> = {
    OPENAI: { icon: Openai, color: 'bg-[#10A37F]' },
    ANTHROPIC: { icon: Anthropic, color: 'bg-[#D97757]' },
    GOOGLE: { icon: Gemini, color: 'bg-white' },
    OPENROUTER: { icon: Openrouter, color: 'bg-gray-500' },
    MISTRAL: { icon: Mistral, color: 'bg-[#FF7000]' },
    GROQ: { icon: Groq, color: 'bg-[#F55036]' },
    PERPLEXITY: { icon: Perplexity, color: 'bg-[#1A6570]' },
    GROK: { icon: Grok, color: 'bg-zinc-900' },
};
