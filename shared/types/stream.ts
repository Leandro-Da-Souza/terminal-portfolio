import type { CommandVariant } from './command';

export type StreamMessage = {
    type: 'message' | 'complete' | 'error';
    output: string;
    variant?: CommandVariant;
};
