import '../config/env.js';
import { createDatabase } from '../services/database.js';
import { seedContent } from './seed-content.js';

const db = createDatabase();
try {
    const counts = await seedContent(db);
    console.log(
        `Seed complete: inserted ${counts.sections} sections and ${counts.projects} projects. Existing records were preserved.`
    );
} catch {
    console.error(
        'Seed failed. Check local connectivity and migration status; no credentials are logged.'
    );
    process.exitCode = 1;
} finally {
    await db.$disconnect();
}
