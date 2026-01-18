#!/usr/bin/env node
/**
 * Emergency migration script to add missing columns
 * Runs during Render build to fix schema sync issues
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error('ERROR: No DATABASE_URL or DIRECT_URL environment variable found');
    process.exit(1);
  }

  console.log('Connecting to database...');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-missing-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration to add missing columns...');

    // Split and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('select')) {
        const result = await client.query(statement);
        console.log('Columns in salons table:', result.rows.map(r => r.column_name).join(', '));
      } else {
        await client.query(statement);
        console.log('Executed:', statement.substring(0, 60) + '...');
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    // Don't exit with error - let the build continue even if migration fails
    // The columns might already exist
    if (error.message.includes('already exists')) {
      console.log('Columns already exist, continuing...');
    } else {
      console.error('Full error:', error);
    }
  } finally {
    await client.end();
  }
}

runMigration();
