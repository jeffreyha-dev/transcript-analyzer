#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * Runs all pending migrations in the migrations/ directory
 * Usage: node scripts/run-migrations.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, '..', 'migrations');

console.log('🔄 Running database migrations...\n');

try {
    // Get all migration files
    const files = await readdir(migrationsDir);
    const migrationFiles = files
        .filter(file => file.endsWith('.js'))
        .sort(); // Run in alphabetical order

    if (migrationFiles.length === 0) {
        console.log('✓ No migrations found');
        process.exit(0);
    }

    console.log(`Found ${migrationFiles.length} migration(s):\n`);

    // Run each migration
    for (const file of migrationFiles) {
        const migrationPath = join(migrationsDir, file);
        console.log(`📦 Running: ${file}`);

        try {
            const { stdout, stderr } = await execAsync(`node "${migrationPath}"`);
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
        } catch (error) {
            console.error(`❌ Error running ${file}:`, error.message);
            process.exit(1);
        }

        console.log(''); // Empty line for readability
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);

} catch (error) {
    console.error('❌ Migration runner error:', error);
    process.exit(1);
}
