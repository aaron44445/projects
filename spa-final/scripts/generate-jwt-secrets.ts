#!/usr/bin/env tsx
/**
 * JWT Secret Generator
 *
 * Generates cryptographically secure JWT secrets for use in environment variables.
 *
 * Usage:
 *   pnpm tsx scripts/generate-jwt-secrets.ts [options]
 *
 * Options:
 *   --length <number>   Length in bytes (default: 64, minimum: 32)
 *   --count <number>    Number of secrets to generate (default: 2)
 *   --format <type>     Output format: hex (default), base64, base64url
 *   --env               Output in .env format
 */

import * as crypto from 'crypto';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface GeneratorOptions {
  length: number;
  count: number;
  format: 'hex' | 'base64' | 'base64url';
  envFormat: boolean;
}

// Parse command line arguments
function parseArgs(): GeneratorOptions {
  const args = process.argv.slice(2);

  const options: GeneratorOptions = {
    length: 64,
    count: 2,
    format: 'hex',
    envFormat: args.includes('--env'),
  };

  // Parse length
  const lengthIndex = args.indexOf('--length');
  if (lengthIndex !== -1 && args[lengthIndex + 1]) {
    const length = parseInt(args[lengthIndex + 1], 10);
    if (isNaN(length)) {
      console.error(`${colors.red}Error: --length must be a number${colors.reset}`);
      process.exit(1);
    }
    if (length < 32) {
      console.error(`${colors.red}Error: --length must be at least 32 bytes${colors.reset}`);
      process.exit(1);
    }
    options.length = length;
  }

  // Parse count
  const countIndex = args.indexOf('--count');
  if (countIndex !== -1 && args[countIndex + 1]) {
    const count = parseInt(args[countIndex + 1], 10);
    if (isNaN(count) || count < 1) {
      console.error(`${colors.red}Error: --count must be a positive number${colors.reset}`);
      process.exit(1);
    }
    options.count = count;
  }

  // Parse format
  const formatIndex = args.indexOf('--format');
  if (formatIndex !== -1 && args[formatIndex + 1]) {
    const format = args[formatIndex + 1].toLowerCase();
    if (!['hex', 'base64', 'base64url'].includes(format)) {
      console.error(`${colors.red}Error: --format must be hex, base64, or base64url${colors.reset}`);
      process.exit(1);
    }
    options.format = format as 'hex' | 'base64' | 'base64url';
  }

  return options;
}

// Generate a single secret
function generateSecret(length: number, format: 'hex' | 'base64' | 'base64url'): string {
  const bytes = crypto.randomBytes(length);

  switch (format) {
    case 'hex':
      return bytes.toString('hex');
    case 'base64':
      return bytes.toString('base64');
    case 'base64url':
      return bytes.toString('base64url');
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Calculate entropy
function calculateEntropy(length: number, format: 'hex' | 'base64' | 'base64url'): number {
  // Entropy in bits = length in bytes * 8
  return length * 8;
}

// Print header
function printHeader() {
  console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════╗
║                                                        ║
║            JWT Secret Generator                        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);
}

// Print security recommendations
function printRecommendations() {
  console.log(`\n${colors.bright}${colors.yellow}Security Recommendations:${colors.reset}\n`);
  console.log(`${colors.yellow}•${colors.reset} Never commit secrets to version control`);
  console.log(`${colors.yellow}•${colors.reset} Use different secrets for different environments`);
  console.log(`${colors.yellow}•${colors.reset} JWT_SECRET and JWT_REFRESH_SECRET must be different`);
  console.log(`${colors.yellow}•${colors.reset} Rotate secrets periodically (every 90 days recommended)`);
  console.log(`${colors.yellow}•${colors.reset} Store secrets in secure environment variable management`);
  console.log(`${colors.yellow}•${colors.reset} Minimum 32 bytes (256 bits), 64 bytes (512 bits) recommended`);
}

// Print usage examples
function printUsageExamples() {
  console.log(`\n${colors.bright}${colors.blue}Usage Examples:${colors.reset}\n`);
  console.log(`Generate default secrets (64 bytes, hex):`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts${colors.reset}\n`);
  console.log(`Generate in .env format:`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts --env${colors.reset}\n`);
  console.log(`Generate 4 secrets with 128 bytes each:`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts --length 128 --count 4${colors.reset}\n`);
  console.log(`Generate in base64 format:`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts --format base64${colors.reset}\n`);
  console.log(`Copy to clipboard (example):`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts --env | clip${colors.reset} (Windows)`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts --env | pbcopy${colors.reset} (macOS)`);
  console.log(`  ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts --env | xclip -selection clipboard${colors.reset} (Linux)\n`);
}

// Main function
function main() {
  const options = parseArgs();

  // Show help if --help flag is present
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHeader();
    console.log(`\n${colors.bright}Description:${colors.reset}`);
    console.log('Generates cryptographically secure random secrets for JWT authentication.\n');
    console.log(`${colors.bright}Options:${colors.reset}`);
    console.log(`  --length <number>   Length in bytes (default: 64, minimum: 32)`);
    console.log(`  --count <number>    Number of secrets to generate (default: 2)`);
    console.log(`  --format <type>     Output format: hex (default), base64, base64url`);
    console.log(`  --env               Output in .env format`);
    console.log(`  --help, -h          Show this help message`);
    printUsageExamples();
    printRecommendations();
    process.exit(0);
  }

  if (!options.envFormat) {
    printHeader();
  }

  // Calculate entropy
  const entropy = calculateEntropy(options.length, options.format);

  if (!options.envFormat) {
    console.log(`${colors.bright}Configuration:${colors.reset}`);
    console.log(`  Length: ${colors.cyan}${options.length} bytes${colors.reset}`);
    console.log(`  Format: ${colors.cyan}${options.format}${colors.reset}`);
    console.log(`  Count:  ${colors.cyan}${options.count}${colors.reset}`);
    console.log(`  Entropy: ${colors.cyan}${entropy} bits${colors.reset}`);

    // Security level indicator
    if (entropy < 256) {
      console.log(`  Security: ${colors.red}WEAK - Increase length!${colors.reset}`);
    } else if (entropy < 512) {
      console.log(`  Security: ${colors.yellow}ACCEPTABLE${colors.reset}`);
    } else {
      console.log(`  Security: ${colors.green}STRONG${colors.reset}`);
    }

    console.log(`\n${colors.bright}Generated Secrets:${colors.reset}\n`);
  }

  // Generate secrets
  const secrets: string[] = [];
  for (let i = 0; i < options.count; i++) {
    const secret = generateSecret(options.length, options.format);
    secrets.push(secret);

    if (options.envFormat) {
      // Output in .env format
      if (i === 0) {
        console.log(`JWT_SECRET=${secret}`);
      } else if (i === 1) {
        console.log(`JWT_REFRESH_SECRET=${secret}`);
      } else {
        console.log(`SECRET_${i + 1}=${secret}`);
      }
    } else {
      // Output with labels and colors
      console.log(`${colors.bright}${colors.green}Secret ${i + 1}:${colors.reset}`);
      console.log(`${colors.cyan}${secret}${colors.reset}\n`);
    }
  }

  if (!options.envFormat) {
    // Show copy instructions
    console.log(`${colors.bright}${colors.blue}Quick Copy:${colors.reset}\n`);

    if (options.count >= 2) {
      console.log(`Add to your ${colors.cyan}apps/api/.env${colors.reset} file:\n`);
      console.log(`${colors.magenta}JWT_SECRET=${colors.reset}${secrets[0]}`);
      console.log(`${colors.magenta}JWT_REFRESH_SECRET=${colors.reset}${secrets[1]}`);
    } else {
      console.log(`Add to your ${colors.cyan}apps/api/.env${colors.reset} file:\n`);
      console.log(`${colors.magenta}JWT_SECRET=${colors.reset}${secrets[0]}`);
    }

    // Print recommendations
    printRecommendations();

    // Verify environment
    console.log(`\n${colors.bright}${colors.blue}Next Steps:${colors.reset}\n`);
    console.log(`1. Copy the secrets above to your ${colors.cyan}apps/api/.env${colors.reset} file`);
    console.log(`2. Verify your environment: ${colors.cyan}pnpm tsx scripts/verify-env.ts${colors.reset}`);
    console.log(`3. Never commit these secrets to version control`);
    console.log(`4. Use different secrets for each environment (dev, staging, production)\n`);
  }
}

// Run the script
try {
  main();
} catch (error) {
  console.error(`\n${colors.red}${colors.bright}✗ ERROR${colors.reset}\n`);
  console.error(error);
  process.exit(1);
}
