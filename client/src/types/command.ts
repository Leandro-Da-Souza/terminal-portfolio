export type ParsedCommand = {
    name: string;
    args?: string[];
}

export type CommandDefinition = {
    description: string;
    execute: (args?: string[], registry?: CommandRegistryType) => string;
}

export type CommandRegistryType = {
    [commandName: ParsedCommand['name']]: CommandDefinition;
}