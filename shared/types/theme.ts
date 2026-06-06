export const Themes = ['rust', 'matrix', 'frost'] as const;

export type Theme = (typeof Themes)[number];

export function isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && Themes.includes(value as Theme)
}