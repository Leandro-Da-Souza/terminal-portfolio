import type { CommandVariant } from './command.js';

export type StreamMessage = {
    type: 'message' | 'complete' | 'error';
    output: string;
    variant?: CommandVariant;
};
