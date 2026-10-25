export class InputError extends Error {
    constructor(public fields: Record<string, string>) {
        super('Please correct the highlighted fields.');
    }
}

export function sectionInput(input: Record<string, unknown>): { body: string } {
    if (
        typeof input.body !== 'string' ||
        !input.body.trim() ||
        input.body.length > 20_000 ||
        /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input.body)
    ) {
        throw new InputError({
            body: 'Enter 1–20,000 characters of plain text. Line breaks and tabs are allowed.',
        });
    }
    return { body: input.body.replace(/\r\n?/g, '\n') };
}

export function projectInput(input: Record<string, unknown>) {
    const errors: Record<string, string> = {};
    const owner = typeof input.owner === 'string' ? input.owner.trim().toLowerCase() : '';
    const repo = typeof input.repo === 'string' ? input.repo.trim().toLowerCase() : '';
    const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
    if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/.test(owner) || owner.includes('--'))
        errors.owner = 'Enter a GitHub owner (1–39 letters, digits or single hyphens).';
    if (!/^[a-z0-9_.-]{1,100}$/.test(repo) || /^\.+$/.test(repo))
        errors.repo = 'Enter the repository name, without an owner or URL.';
    if (!displayName || displayName.length > 120 || /[\r\n\x00-\x1F\x7F]/.test(displayName))
        errors.displayName = 'Enter a single-line display name of 1–120 characters.';
    const rawPosition = String(input.position ?? '');
    const position = Number(rawPosition);
    if (
        !/^[1-9]\d*$/.test(rawPosition) ||
        !Number.isSafeInteger(position) ||
        position > 2_147_483_647
    )
        errors.position = 'Enter an unused positive whole number (at most 2147483647).';
    if (
        input.featured !== undefined &&
        ![true, false, 'true', 'false'].includes(input.featured as boolean)
    )
        errors.featured = 'Choose featured or hidden.';
    if (Object.keys(errors).length) throw new InputError(errors);
    return {
        owner,
        repo,
        displayName,
        position,
        featured: input.featured === true || input.featured === 'true',
    };
}
