// This file must be imported FIRST to load environment variables before any other code runs
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the api directory
dotenv.config({ path: join(__dirname, '..', '.env') });
