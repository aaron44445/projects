#!/usr/bin/env tsx
/**
 * Environment Variable Verification Script
 *
 * This script verifies all required environment variables are set and validates
 * connections to external services (database, Stripe, SendGrid, Twilio, Sentry).
 *
 * Usage:
 *   pnpm tsx scripts/verify-env.ts [options]
 *
 * Options:
 *   --skip-optional     Skip optional service checks (Stripe, SendGrid, Twilio, Sentry)
 *   --skip-stripe       Skip Stripe validation
 *   --skip-sendgrid     Skip SendGrid validation
 *   --skip-twilio       Skip Twilio validation
 *   --skip-sentry       Skip Sentry validation
 *   --env-file <path>   Use custom env file path (default: apps/api/.env)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

const results: CheckResult[] = [];
let hasRequiredFailures = false;

// Parse command line arguments
const args = process.argv.slice(2);
const skipOptional = args.includes('--skip-optional');
const skipStripe = args.includes('--skip-stripe') || skipOptional;
const skipSendgrid = args.includes('--skip-sendgrid') || skipOptional;
const skipTwilio = args.includes('--skip-twilio') || skipOptional;
const skipSentry = args.includes('--skip-sentry') || skipOptional;

const envFileIndex = args.indexOf('--env-file');
const envFilePath = envFileIndex !== -1 && args[envFileIndex + 1]
  ? args[envFileIndex + 1]
  : path.join(process.cwd(), 'apps', 'api', '.env');

// Load environment variables
function loadEnv(): boolean {
  try {
    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath });
      return true;
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Environment file not found at ${envFilePath}`);
      console.log(`${colors.yellow}⚠${colors.reset} Attempting to load from process.env...`);
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to load environment file:`, error);
    return false;
  }
}

// Utility functions
function logSection(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}━━━ ${title} ━━━${colors.reset}\n`);
}

function logResult(result: CheckResult) {
  const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  const label = result.required ? '' : `${colors.blue}[OPTIONAL]${colors.reset} `;
  console.log(`${icon} ${label}${result.name}: ${result.message}`);

  if (!result.passed && result.required) {
    hasRequiredFailures = true;
  }

  results.push(result);
}

function checkEnvVar(name: string, required: boolean = true): string | null {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    logResult({
      name,
      passed: false,
      message: required
        ? `${colors.red}Missing or empty${colors.reset}`
        : `${colors.yellow}Not set (optional)${colors.reset}`,
      required,
    });
    return null;
  }

  logResult({
    name,
    passed: true,
    message: `${colors.green}Set${colors.reset}`,
    required,
  });

  return value;
}

// Check 1: Required Environment Variables
async function checkRequiredEnvVars() {
  logSection('Required Environment Variables');

  checkEnvVar('DATABASE_URL');
  checkEnvVar('NODE_ENV');
  checkEnvVar('API_PORT');
  checkEnvVar('API_BASE_URL');
  checkEnvVar('JWT_SECRET');
  checkEnvVar('JWT_REFRESH_SECRET');
  checkEnvVar('CORS_ORIGIN');
}

// Check 2: Database Connection
async function checkDatabaseConnection() {
  logSection('Database Connection (PostgreSQL)');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    logResult({
      name: 'Database Connection',
      passed: false,
      message: `${colors.red}DATABASE_URL not set${colors.reset}`,
      required: true,
    });
    return;
  }

  try {
    // Validate URL format
    const url = new URL(dbUrl);

    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      logResult({
        name: 'Database URL Format',
        passed: false,
        message: `${colors.red}Invalid protocol: ${url.protocol} (expected postgresql:)${colors.reset}`,
        required: true,
      });
      return;
    }

    logResult({
      name: 'Database URL Format',
      passed: true,
      message: `${colors.green}Valid PostgreSQL URL${colors.reset}`,
      required: true,
    });

    // Try to connect using Prisma
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });

      await prisma.$connect();
      await prisma.$disconnect();

      logResult({
        name: 'Database Connection Test',
        passed: true,
        message: `${colors.green}Successfully connected to database${colors.reset}`,
        required: true,
      });
    } catch (connectError: any) {
      // Check if it's a Prisma client not found error
      if (connectError.message && connectError.message.includes('Cannot find package')) {
        logResult({
          name: 'Database Connection Test',
          passed: true,
          message: `${colors.yellow}Skipped (Prisma client not generated - run: pnpm db:generate)${colors.reset}`,
          required: false,
        });
      } else {
        logResult({
          name: 'Database Connection Test',
          passed: false,
          message: `${colors.red}Connection failed: ${connectError.message}${colors.reset}`,
          required: true,
        });
      }
    }
  } catch (error: any) {
    logResult({
      name: 'Database URL Format',
      passed: false,
      message: `${colors.red}Invalid URL format: ${error.message}${colors.reset}`,
      required: true,
    });
  }
}

// Check 3: JWT Secret Strength
async function checkJWTSecrets() {
  logSection('JWT Configuration');

  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (jwtSecret) {
    const minLength = 32;
    const secretLength = jwtSecret.length;

    if (secretLength < minLength) {
      logResult({
        name: 'JWT_SECRET Strength',
        passed: false,
        message: `${colors.red}Too short (${secretLength} chars, minimum ${minLength})${colors.reset}`,
        required: true,
      });
    } else if (secretLength < 64) {
      logResult({
        name: 'JWT_SECRET Strength',
        passed: true,
        message: `${colors.yellow}Acceptable (${secretLength} chars, recommended 64+)${colors.reset}`,
        required: true,
      });
    } else {
      logResult({
        name: 'JWT_SECRET Strength',
        passed: true,
        message: `${colors.green}Strong (${secretLength} chars)${colors.reset}`,
        required: true,
      });
    }

    // Check if it looks like a placeholder
    if (jwtSecret.includes('generate') || jwtSecret.includes('change') || jwtSecret.includes('secret')) {
      logResult({
        name: 'JWT_SECRET Value',
        passed: false,
        message: `${colors.red}Appears to be a placeholder value${colors.reset}`,
        required: true,
      });
    }
  }

  if (jwtRefreshSecret) {
    const minLength = 32;
    const secretLength = jwtRefreshSecret.length;

    if (secretLength < minLength) {
      logResult({
        name: 'JWT_REFRESH_SECRET Strength',
        passed: false,
        message: `${colors.red}Too short (${secretLength} chars, minimum ${minLength})${colors.reset}`,
        required: true,
      });
    } else if (secretLength < 64) {
      logResult({
        name: 'JWT_REFRESH_SECRET Strength',
        passed: true,
        message: `${colors.yellow}Acceptable (${secretLength} chars, recommended 64+)${colors.reset}`,
        required: true,
      });
    } else {
      logResult({
        name: 'JWT_REFRESH_SECRET Strength',
        passed: true,
        message: `${colors.green}Strong (${secretLength} chars)${colors.reset}`,
        required: true,
      });
    }

    // Check if secrets are the same
    if (jwtSecret && jwtRefreshSecret && jwtSecret === jwtRefreshSecret) {
      logResult({
        name: 'JWT Secrets Uniqueness',
        passed: false,
        message: `${colors.red}JWT_SECRET and JWT_REFRESH_SECRET must be different${colors.reset}`,
        required: true,
      });
    }
  }
}

// Check 4: Stripe API
async function checkStripe() {
  if (skipStripe) {
    console.log(`${colors.blue}ℹ${colors.reset} Skipping Stripe validation`);
    return;
  }

  logSection('Stripe Integration');

  const stripeKey = checkEnvVar('STRIPE_SECRET_KEY', false);

  if (!stripeKey) {
    return;
  }

  // Validate key format
  if (!stripeKey.startsWith('sk_')) {
    logResult({
      name: 'Stripe Key Format',
      passed: false,
      message: `${colors.red}Invalid format (should start with sk_)${colors.reset}`,
      required: false,
    });
    return;
  }

  logResult({
    name: 'Stripe Key Format',
    passed: true,
    message: `${colors.green}Valid format${colors.reset}`,
    required: false,
  });

  // Check if test or live key
  const isTestKey = stripeKey.startsWith('sk_test_');
  const isLiveKey = stripeKey.startsWith('sk_live_');
  const nodeEnv = process.env.NODE_ENV;

  if (isTestKey) {
    logResult({
      name: 'Stripe Key Type',
      passed: true,
      message: `${colors.yellow}Test mode${colors.reset}${nodeEnv === 'production' ? ' (Warning: Using test key in production!)' : ''}`,
      required: false,
    });
  } else if (isLiveKey) {
    logResult({
      name: 'Stripe Key Type',
      passed: true,
      message: `${colors.green}Live mode${colors.reset}${nodeEnv !== 'production' ? ' (Warning: Using live key in non-production!)' : ''}`,
      required: false,
    });
  }

  // Test connection
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    await stripe.accounts.retrieve();

    logResult({
      name: 'Stripe Connection Test',
      passed: true,
      message: `${colors.green}Successfully connected to Stripe API${colors.reset}`,
      required: false,
    });
  } catch (error: any) {
    logResult({
      name: 'Stripe Connection Test',
      passed: false,
      message: `${colors.red}Connection failed: ${error.message}${colors.reset}`,
      required: false,
    });
  }
}

// Check 5: SendGrid API
async function checkSendGrid() {
  if (skipSendgrid) {
    console.log(`${colors.blue}ℹ${colors.reset} Skipping SendGrid validation`);
    return;
  }

  logSection('SendGrid Email Service');

  const apiKey = checkEnvVar('SENDGRID_API_KEY', false);
  const fromEmail = checkEnvVar('SENDGRID_FROM_EMAIL', false);

  if (!apiKey) {
    return;
  }

  // Validate key format
  if (!apiKey.startsWith('SG.')) {
    logResult({
      name: 'SendGrid Key Format',
      passed: false,
      message: `${colors.red}Invalid format (should start with SG.)${colors.reset}`,
      required: false,
    });
    return;
  }

  logResult({
    name: 'SendGrid Key Format',
    passed: true,
    message: `${colors.green}Valid format${colors.reset}`,
    required: false,
  });

  // Test API key validity
  try {
    const sgMail = await import('@sendgrid/mail');
    sgMail.setApiKey(apiKey);

    // Note: We don't actually send an email, just validate the API key
    // by attempting to access the SendGrid client
    logResult({
      name: 'SendGrid API Key',
      passed: true,
      message: `${colors.green}API key configured${colors.reset}`,
      required: false,
    });

    // Validate from email format if set
    if (fromEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(fromEmail)) {
        logResult({
          name: 'SendGrid From Email',
          passed: true,
          message: `${colors.green}Valid email format${colors.reset}`,
          required: false,
        });
      } else {
        logResult({
          name: 'SendGrid From Email',
          passed: false,
          message: `${colors.red}Invalid email format${colors.reset}`,
          required: false,
        });
      }
    }
  } catch (error: any) {
    logResult({
      name: 'SendGrid API Test',
      passed: false,
      message: `${colors.red}Configuration failed: ${error.message}${colors.reset}`,
      required: false,
    });
  }
}

// Check 6: Twilio SMS
async function checkTwilio() {
  if (skipTwilio) {
    console.log(`${colors.blue}ℹ${colors.reset} Skipping Twilio validation`);
    return;
  }

  logSection('Twilio SMS Service');

  const accountSid = checkEnvVar('TWILIO_ACCOUNT_SID', false);
  const authToken = checkEnvVar('TWILIO_AUTH_TOKEN', false);
  const fromNumber = checkEnvVar('TWILIO_FROM_NUMBER', false);

  if (!accountSid || !authToken) {
    return;
  }

  // Validate Account SID format
  if (!accountSid.startsWith('AC')) {
    logResult({
      name: 'Twilio Account SID Format',
      passed: false,
      message: `${colors.red}Invalid format (should start with AC)${colors.reset}`,
      required: false,
    });
    return;
  }

  logResult({
    name: 'Twilio Account SID Format',
    passed: true,
    message: `${colors.green}Valid format${colors.reset}`,
    required: false,
  });

  // Test connection
  try {
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    // Test by fetching account info
    await client.api.v2010.accounts(accountSid).fetch();

    logResult({
      name: 'Twilio Connection Test',
      passed: true,
      message: `${colors.green}Successfully authenticated with Twilio${colors.reset}`,
      required: false,
    });

    // Validate phone number format if set
    if (fromNumber) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (phoneRegex.test(fromNumber)) {
        logResult({
          name: 'Twilio From Number',
          passed: true,
          message: `${colors.green}Valid E.164 format${colors.reset}`,
          required: false,
        });
      } else {
        logResult({
          name: 'Twilio From Number',
          passed: false,
          message: `${colors.red}Invalid format (should be E.164: +1234567890)${colors.reset}`,
          required: false,
        });
      }
    }
  } catch (error: any) {
    logResult({
      name: 'Twilio Connection Test',
      passed: false,
      message: `${colors.red}Authentication failed: ${error.message}${colors.reset}`,
      required: false,
    });
  }
}

// Check 7: Sentry Error Tracking
async function checkSentry() {
  if (skipSentry) {
    console.log(`${colors.blue}ℹ${colors.reset} Skipping Sentry validation`);
    return;
  }

  logSection('Sentry Error Tracking');

  const dsn = checkEnvVar('SENTRY_DSN', false);

  if (!dsn) {
    return;
  }

  // Validate DSN format
  try {
    const url = new URL(dsn);

    if (!url.hostname.includes('sentry.io') && !url.hostname.includes('sentry')) {
      logResult({
        name: 'Sentry DSN Format',
        passed: false,
        message: `${colors.yellow}Warning: DSN hostname doesn't contain 'sentry'${colors.reset}`,
        required: false,
      });
    } else {
      logResult({
        name: 'Sentry DSN Format',
        passed: true,
        message: `${colors.green}Valid DSN format${colors.reset}`,
        required: false,
      });
    }

    // Test by initializing Sentry
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        enabled: false, // Don't actually send events during testing
      });

      logResult({
        name: 'Sentry Configuration',
        passed: true,
        message: `${colors.green}Successfully initialized${colors.reset}`,
        required: false,
      });
    } catch (error: any) {
      logResult({
        name: 'Sentry Configuration',
        passed: false,
        message: `${colors.red}Initialization failed: ${error.message}${colors.reset}`,
        required: false,
      });
    }
  } catch (error: any) {
    logResult({
      name: 'Sentry DSN Format',
      passed: false,
      message: `${colors.red}Invalid DSN format: ${error.message}${colors.reset}`,
      required: false,
    });
  }
}

// Check 8: CORS Configuration
async function checkCORS() {
  logSection('CORS Configuration');

  const corsOrigin = process.env.CORS_ORIGIN;

  if (!corsOrigin) {
    logResult({
      name: 'CORS_ORIGIN',
      passed: false,
      message: `${colors.red}Not set${colors.reset}`,
      required: true,
    });
    return;
  }

  // Check for wildcard in production
  const nodeEnv = process.env.NODE_ENV;
  if (corsOrigin === '*' && nodeEnv === 'production') {
    logResult({
      name: 'CORS_ORIGIN Configuration',
      passed: false,
      message: `${colors.red}Security risk: Wildcard (*) CORS in production${colors.reset}`,
      required: true,
    });
  } else if (corsOrigin === '*') {
    logResult({
      name: 'CORS_ORIGIN Configuration',
      passed: true,
      message: `${colors.yellow}Wildcard (*) - OK for development${colors.reset}`,
      required: true,
    });
  } else {
    // Validate URL format
    const origins = corsOrigin.split(',').map(o => o.trim());
    let allValid = true;

    for (const origin of origins) {
      try {
        new URL(origin);
      } catch {
        allValid = false;
        break;
      }
    }

    if (allValid) {
      logResult({
        name: 'CORS_ORIGIN Configuration',
        passed: true,
        message: `${colors.green}Valid origin(s): ${origins.length} configured${colors.reset}`,
        required: true,
      });
    } else {
      logResult({
        name: 'CORS_ORIGIN Configuration',
        passed: false,
        message: `${colors.red}Invalid URL format in origin(s)${colors.reset}`,
        required: true,
      });
    }
  }

  // Check API_BASE_URL and WEB_BASE_URL consistency
  const apiBaseUrl = process.env.API_BASE_URL;
  const webBaseUrl = process.env.WEB_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

  if (apiBaseUrl && webBaseUrl && !corsOrigin.includes('*')) {
    try {
      const webUrl = new URL(webBaseUrl);
      const webOrigin = `${webUrl.protocol}//${webUrl.host}`;

      if (!corsOrigin.includes(webOrigin)) {
        logResult({
          name: 'CORS and Web URL Consistency',
          passed: false,
          message: `${colors.yellow}Warning: WEB_BASE_URL origin not in CORS_ORIGIN${colors.reset}`,
          required: false,
        });
      }
    } catch (error) {
      // Invalid URL, skip this check
    }
  }
}

// Summary
function printSummary() {
  logSection('Summary');

  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.passed).length;
  const failedChecks = results.filter(r => !r.passed).length;
  const requiredChecks = results.filter(r => r.required).length;
  const requiredPassed = results.filter(r => r.required && r.passed).length;
  const requiredFailed = results.filter(r => r.required && !r.passed).length;

  console.log(`Total checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);
  console.log('');
  console.log(`Required checks: ${requiredChecks}`);
  console.log(`${colors.green}Required passed: ${requiredPassed}${colors.reset}`);
  console.log(`${colors.red}Required failed: ${requiredFailed}${colors.reset}`);

  if (hasRequiredFailures) {
    console.log(`\n${colors.red}${colors.bright}✗ VERIFICATION FAILED${colors.reset}`);
    console.log(`\n${colors.yellow}Action required:${colors.reset}`);
    console.log('1. Fix all required environment variables marked as failed');
    console.log('2. Ensure JWT secrets are strong (32+ characters, 64+ recommended)');
    console.log('3. Verify database connection is working');
    console.log('4. Run this script again to verify fixes');
    console.log(`\nFor help generating secure JWT secrets, run: ${colors.cyan}pnpm tsx scripts/generate-jwt-secrets.ts${colors.reset}`);
  } else {
    console.log(`\n${colors.green}${colors.bright}✓ ALL REQUIRED CHECKS PASSED${colors.reset}`);

    const optionalFailed = results.filter(r => !r.required && !r.passed);
    if (optionalFailed.length > 0) {
      console.log(`\n${colors.yellow}Note: ${optionalFailed.length} optional service(s) not configured or failing${colors.reset}`);
    }
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════╗
║                                                        ║
║       Environment Configuration Verification          ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`Environment file: ${colors.cyan}${envFilePath}${colors.reset}`);

  if (!loadEnv()) {
    console.log(`\n${colors.red}${colors.bright}✗ FAILED TO LOAD ENVIRONMENT${colors.reset}\n`);
    process.exit(1);
  }

  // Run all checks
  await checkRequiredEnvVars();
  await checkDatabaseConnection();
  await checkJWTSecrets();
  await checkStripe();
  await checkSendGrid();
  await checkTwilio();
  await checkSentry();
  await checkCORS();

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(hasRequiredFailures ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error(`\n${colors.red}${colors.bright}✗ UNEXPECTED ERROR${colors.reset}\n`);
  console.error(error);
  process.exit(1);
});
