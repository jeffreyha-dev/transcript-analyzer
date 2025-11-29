#!/usr/bin/env node

/**
 * Schema Export Script
 * 
 * Exports the current database schema to a SQL file
 * Usage: node scripts/export-schema.js [output-file]
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'transcripts.db');
const outputFile = process.argv[2] || join(__dirname, '..', 'schema.sql');

console.log('📤 Exporting database schema...');
console.log(`Database: ${dbPath}`);
console.log(`Output: ${outputFile}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        process.exit(1);
    }
});

db.all(`SELECT sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY tbl_name, type DESC, name`, async (err, rows) => {
    if (err) {
        console.error('❌ Error reading schema:', err);
        db.close();
        process.exit(1);
    }

    try {
        // Build schema SQL
        const header = `-- Transcript Analyzer Database Schema
-- Generated: ${new Date().toISOString()}
-- SQLite version: ${process.versions.sqlite || 'unknown'}

PRAGMA foreign_keys = ON;

`;

        const schema = rows.map(row => row.sql + ';').join('\n\n');
        const fullSchema = header + schema;

        // Write to file
        await writeFile(outputFile, fullSchema, 'utf8');

        console.log(`✅ Schema exported successfully!`);
        console.log(`   ${rows.length} objects exported`);
        console.log(`   File: ${outputFile}`);

        db.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error writing schema file:', error);
        db.close();
        process.exit(1);
    }
});
