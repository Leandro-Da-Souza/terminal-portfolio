export type ParsedCommand = {
    name: string;
    args?: string[];
};

export type CommandResult = {
    type: 'output' | 'effect';
    output?: string;
    effect?: string;
    parameter?: any;
    variant?: 'command' | 'system';
};

export type CommandDefinition = {
    description: string;
    execute: (args?: string[], registry?: CommandRegistryType) => CommandResult;
};

export type CommandRegistryType = {
    [commandName: ParsedCommand['name']]: CommandDefinition;
};
