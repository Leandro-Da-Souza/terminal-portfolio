export type ParsedCommand = {
    name: string;
    args: string[];
};

export type CommandVariant = 'command' | 'system';

export type CommandEffect =
    | 'clear'
    | 'theme-change'
    | 'shutdown';


type OutputResult = {
    type: 'output',
    output: string;
    variant?: CommandVariant
}

type EffectResult = {
    type: 'effect',
    effect: CommandEffect,
    parameter?: string
    output?: string
}

type StreamResult = {
    type: 'stream',
    endpoint: string
}

export type CommandResult = OutputResult | EffectResult | StreamResult;

export type CommandMetaDataType = {
    description: string;
    scope: 'client' | 'server';
    transport: 'local' | 'request' | 'stream'
};

export type CommandDefinition = {
    execute: (
        args?: string[], 
        registry?: Record<string, CommandMetaDataType>
    ) => CommandResult;
};

export type CommandRegistryType = {
    [commandName: ParsedCommand['name']]: CommandDefinition;
};
