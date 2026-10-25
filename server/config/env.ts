import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Find the server workspace in both source and compiled layouts, independent of cwd.
let directory = path.dirname(fileURLToPath(import.meta.url));
while (!existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error('Cannot locate the server workspace.');
    directory = parent;
}
export const serverRoot = directory;
export const repositoryRoot = path.dirname(serverRoot);
// Railway and test-runner variables take precedence over the local file.
dotenv.config({ path: path.join(serverRoot, '.env'), override: false, quiet: true });

process.env.ADMIN_JS_TMP_DIR ??= path.join(serverRoot, 'adminjs-assets');
