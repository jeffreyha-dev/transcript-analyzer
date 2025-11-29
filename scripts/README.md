# Database Scripts

This directory contains utility scripts for managing the Transcript Analyzer database.

## Available Scripts

### 1. Initialize Database (`init-database.js`)

Creates a fresh database with all tables and seed data.

```bash
# Create new database (fails if database exists)
node scripts/init-database.js

# Force recreate (WARNING: deletes all existing data!)
node scripts/init-database.js --force
```

**What it does:**
- Deletes existing database (if `--force` is used)
- Creates all 11 tables
- Seeds default AI prompt
- Seeds default metric configurations
- Seeds default analysis configurations

### 2. Run Migrations (`run-migrations.js`)

Runs all pending migrations in the `migrations/` directory.

```bash
node scripts/run-migrations.js
```

**What it does:**
- Scans `migrations/` directory for `.js` files
- Runs migrations in alphabetical order
- Reports success/failure for each migration

### 3. Export Schema (`export-schema.js`)

Exports the current database schema to a SQL file.

```bash
# Export to default location (schema.sql)
node scripts/export-schema.js

# Export to custom location
node scripts/export-schema.js path/to/output.sql
```

**What it does:**
- Reads current database schema
- Generates SQL CREATE statements
- Writes to file with timestamp header

## Migration Guide

### Creating a New Migration

1. Create a new file in `migrations/` directory:
   ```bash
   touch migrations/add_new_feature.js
   ```

2. Use this template:
   ```javascript
   import sqlite3 from 'sqlite3';
   import { fileURLToPath } from 'url';
   import { dirname, join } from 'path';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   const dbPath = join(__dirname, '..', 'transcripts.db');
   
   console.log('Starting migration: add_new_feature');
   
   const db = new sqlite3.Database(dbPath, (err) => {
       if (err) {
           console.error('Error opening database:', err);
           process.exit(1);
       }
   });
   
   db.serialize(() => {
       // Add new table
       db.run(`
           CREATE TABLE IF NOT EXISTS new_table (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               name TEXT NOT NULL,
               created_at DATETIME DEFAULT CURRENT_TIMESTAMP
           )
       `, (err) => {
           if (err) console.error('Error creating table:', err);
           else console.log('✓ Created new_table');
       });
       
       // Add new column to existing table
       db.all(`PRAGMA table_info(existing_table)`, (err, columns) => {
           if (err) {
               console.error('Error checking schema:', err);
               return;
           }
           
           const columnNames = columns.map(col => col.name);
           
           if (!columnNames.includes('new_column')) {
               db.run(`ALTER TABLE existing_table ADD COLUMN new_column TEXT`, (err) => {
                   if (err) console.error('Error adding column:', err);
                   else console.log('✓ Added new_column');
                   
                   db.close();
               });
           } else {
               console.log('✓ new_column already exists');
               db.close();
           }
       });
   });
   ```

3. Run the migration:
   ```bash
   node migrations/add_new_feature.js
   ```

### Migration Best Practices

1. **Idempotent Migrations**: Always use `IF NOT EXISTS` for CREATE statements and check for existing columns before ALTER TABLE
2. **Naming Convention**: Use descriptive names like `add_feature_name.js` or `update_table_name.js`
3. **Error Handling**: Always include error callbacks and log success/failure
4. **Data Preservation**: Never delete data without explicit confirmation
5. **Testing**: Test migrations on a backup database first

## Database Backup & Restore

### Backup

```bash
# Simple file copy
cp transcripts.db transcripts.db.backup

# With timestamp
cp transcripts.db "transcripts.db.backup.$(date +%Y%m%d_%H%M%S)"

# Export to SQL (portable)
node scripts/export-schema.js schema.sql
sqlite3 transcripts.db .dump > full_backup.sql
```

### Restore

```bash
# From file copy
cp transcripts.db.backup transcripts.db

# From SQL dump
sqlite3 transcripts.db < full_backup.sql
```

## Troubleshooting

### Database Locked Error

If you get "database is locked" errors:

```bash
# Check for processes using the database
lsof transcripts.db

# Kill the process if needed
kill -9 <PID>
```

### Corrupted Database

If the database becomes corrupted:

```bash
# Try to recover
sqlite3 transcripts.db "PRAGMA integrity_check;"

# If recovery fails, restore from backup
cp transcripts.db.backup transcripts.db
```

### Migration Failed

If a migration fails partway through:

1. Check the error message
2. Fix the migration script
3. Manually revert changes if needed:
   ```bash
   sqlite3 transcripts.db
   > DROP TABLE IF EXISTS new_table;
   > .quit
   ```
4. Re-run the migration

## See Also

- [DATABASE.md](../DATABASE.md) - Complete schema documentation
- [migrations/](../migrations/) - Migration files
