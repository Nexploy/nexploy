import type { Realtime } from 'inngest/realtime';

export type BuildToken = Realtime.Subscribe.Token;

export type BuildMessage = Realtime.Subscribe.Token.InferMessage<BuildToken>;
