/**
 * Stripe Product Setup Script
 *
 * Creates all subscription products and prices in Stripe.
 * Run this once per environment (test/live) to set up billing products.
 *
 * Usage:
 *   npx ts-node --esm scripts/setup-stripe-products.ts
 *
 * After running, copy the output price IDs to your .env file.
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY is not set in environment');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Product definitions - Single Professional tier
const SUBSCRIPTION_PLANS = [
  {
    id: 'professional',
    name: 'Peacase Professional',
    description: 'Everything you need to run your spa or salon business',
    price: 4900, // $49.00 in cents
    features: [
      'Unlimited staff members',
      'Unlimited clients',
      'Full scheduling system',
      'Calendar management',
      'Client management',
      'Priority email support',
    ],
  },
];

// 7 add-ons at $25/mo each (reviews removed)
const ADDON_PRODUCTS = [
  {
    id: 'online_booking',
    name: 'Online Booking',
    description: 'Let clients book appointments 24/7 from your website',
  },
  {
    id: 'payment_processing',
    name: 'Payment Processing',
    description: 'Accept credit cards, Apple Pay, Google Pay',
  },
  {
    id: 'reminders',
    name: 'SMS/Email Reminders',
    description: 'Reduce no-shows with automated appointment reminders',
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Revenue dashboards and staff performance tracking',
  },
  {
    id: 'memberships',
    name: 'Packages & Memberships',
    description: 'Sell service packages and recurring memberships',
  },
  {
    id: 'gift_cards',
    name: 'Gift Cards',
    description: 'Sell and redeem digital gift cards',
  },
  {
    id: 'marketing',
    name: 'Marketing Automation',
    description: 'Automated campaigns and promotional emails',
  },
];

const ADDON_PRICE = 2500; // $25.00 in cents
const EXTRA_LOCATION_PRICE = 10000; // $100.00 in cents

interface CreatedProduct {
  productId: string;
  priceId: string;
  name: string;
  envVar: string;
}

async function createProduct(
  name: string,
  description: string,
  metadata: Record<string, string>
): Promise<string> {
  const product = await stripe.products.create({
    name,
    description,
    metadata,
  });
  return product.id;
}

async function createPrice(
  productId: string,
  unitAmount: number,
  metadata: Record<string, string>
): Promise<string> {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata,
  });
  return price.id;
}

async function main() {
  console.log('\n========================================');
  console.log('Peacase Stripe Product Setup');
  console.log('========================================\n');

  const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_');
  console.log(`Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
  console.log('');

  const createdProducts: CreatedProduct[] = [];

  // Create subscription plans
  console.log('Creating subscription plans...');
  for (const plan of SUBSCRIPTION_PLANS) {
    const envVarName = `STRIPE_${plan.id.toUpperCase()}_PRICE_ID`;

    try {
      const productId = await createProduct(plan.name, plan.description, {
        peacase_type: 'subscription_plan',
        peacase_plan_id: plan.id,
      });

      const priceId = await createPrice(productId, plan.price, {
        peacase_type: 'subscription_plan',
        peacase_plan_id: plan.id,
      });

      createdProducts.push({
        productId,
        priceId,
        name: plan.name,
        envVar: envVarName,
      });

      console.log(`  ✓ ${plan.name}: ${priceId}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${plan.name}:`, error);
    }
  }

  // Create add-on products
  console.log('\nCreating add-on products...');
  for (const addon of ADDON_PRODUCTS) {
    const envVarName = `STRIPE_ADDON_${addon.id.toUpperCase()}_PRICE_ID`;

    try {
      const productId = await createProduct(
        `Peacase Add-on: ${addon.name}`,
        addon.description,
        {
          peacase_type: 'addon',
          peacase_addon_id: addon.id,
        }
      );

      const priceId = await createPrice(productId, ADDON_PRICE, {
        peacase_type: 'addon',
        peacase_addon_id: addon.id,
      });

      createdProducts.push({
        productId,
        priceId,
        name: addon.name,
        envVar: envVarName,
      });

      console.log(`  ✓ ${addon.name}: ${priceId}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${addon.name}:`, error);
    }
  }

  // Create extra locations product
  console.log('\nCreating extra locations product...');
  try {
    const productId = await createProduct(
      'Peacase Extra Location',
      'Additional business location for multi-location businesses',
      {
        peacase_type: 'extra_location',
      }
    );

    const priceId = await createPrice(productId, EXTRA_LOCATION_PRICE, {
      peacase_type: 'extra_location',
    });

    createdProducts.push({
      productId,
      priceId,
      name: 'Extra Location',
      envVar: 'STRIPE_EXTRA_LOCATION_PRICE_ID',
    });

    console.log(`  ✓ Extra Location: ${priceId}`);
  } catch (error) {
    console.error('  ✗ Failed to create Extra Location:', error);
  }

  // Output environment variables
  console.log('\n========================================');
  console.log('Add these to your .env file:');
  console.log('========================================\n');

  for (const product of createdProducts) {
    console.log(`${product.envVar}=${product.priceId}`);
  }

  console.log('\n========================================');
  console.log('Setup complete!');
  console.log('========================================\n');

  // Return for programmatic use
  return createdProducts;
}

main().catch(console.error);
