export type ParsedCommand = {
    name: string;
    args: string[];
};

export type CommandVariant = 'command' | 'system';

export type CommandEffect =
    | 'clear'
    | 'theme-change'
    | 'shutdown';

export type CommandMode = 'machine-spirit';

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

type ModeResult = {
    type: 'mode',
    mode: CommandMode,
    endpoint: string
}

export type CommandResult = OutputResult | EffectResult | ModeResult;

export type CommandMetaDataType = {
    description: string;
    scope: 'client' | 'server';
    transport: 'local' | 'request' | 'mode'
};

export type CommandDefinition = {
    execute: (
        args?: string[], 
        registry?: Record<string, CommandMetaDataType>
    ) => CommandResult | Promise<CommandResult>;
};

export type CommandRegistryType = {
    [commandName: ParsedCommand['name']]: CommandDefinition;
};
