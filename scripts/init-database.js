#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * Creates a fresh database with all tables and seed data
 * Usage: node scripts/init-database.js [--force]
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { initDatabase } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'transcripts.db');
const force = process.argv.includes('--force');

console.log('🗄️  Database Initialization Script\n');

async function main() {
    // Check if database exists
    if (existsSync(dbPath)) {
        if (!force) {
            console.log('⚠️  Database already exists!');
            console.log('   Use --force flag to recreate the database');
            console.log('   WARNING: This will delete all existing data!\n');
            console.log('   Command: node scripts/init-database.js --force');
            process.exit(1);
        }

        console.log('🗑️  Deleting existing database...');
        await unlink(dbPath);
        console.log('✓ Database deleted\n');
    }

    console.log('📦 Creating new database...');
    console.log(`   Path: ${dbPath}\n`);

    try {
        await initDatabase();
        console.log('\n✅ Database initialized successfully!');
        console.log('\nThe database includes:');
        console.log('  • 11 tables (conversations, analysis_results, ai_analysis_results, etc.)');
        console.log('  • Default AI prompt (comprehensive analysis)');
        console.log('  • Default metric configurations (CES, NPS, CSAT, churnRiskScore)');
        console.log('  • Default analysis configurations (sentiment keywords, topic patterns)');
        console.log('\nYou can now start the server with: npm run dev');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error initializing database:', error);
        process.exit(1);
    }
}

main();
