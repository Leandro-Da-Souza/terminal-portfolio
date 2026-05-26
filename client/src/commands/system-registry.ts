import type { CommandResult } from "../../../shared/types/command";

/**
 * System messages for loading / error states and fake bootup sequence 
 */
export const BootSequence = [
    'INITIALIZING MACHINE SPIRIT...',
    'LOADING NOOSPHERIC INDEX...',
    'VERIFYING PROTOCOLS...',
    'SYSTEM ONLINE.'
];

export const SystemMessages = {
    relayConnecting:
        'CONTACTING RELAY...',

    relayConnected:
        'RELAY CONNECTION ESTABLISHED',

    relayFailed:
        'RELAY CONNECTION FAILED'
};

export const ServerErrorMessage = {
    type: 'output',
    output: 'Unable to reach terminal server.',
    variant: 'command'
} satisfies CommandResult