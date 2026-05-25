export type ParsedCommand = {
    name: string;
    args: string[];
};

export type CommandEffect = 'clear' | 'theme-change' | 'shutdown';

export type CommandVariant = 'command' | 'system';

export type CommandParameter = string;

export type CommandResult = {
    type: 'output' | 'effect';
    output?: string;
    effect?: CommandEffect;
    parameter?: CommandParameter;
    variant?: CommandVariant;
};

export type CommandMetaDataType = {
    description: string;
    scope: 'client' | 'server';
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
