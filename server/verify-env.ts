/**
 * Environment Variable Verification Script
 * Run this to check if all required environment variables are set
 */

const requiredVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
];

const recommendedVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
];

const optionalVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'APP_URL',
];

console.log('🔍 Verifying Environment Variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('✅ Required Variables:');
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`  ❌ ${varName} - MISSING (CRITICAL)`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${varName} - Set`);
  }
});

// Check recommended variables
console.log('\n⚠️  Recommended Variables (for full functionality):');
recommendedVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`  ⚠️  ${varName} - Missing (payments may not work)`);
    hasWarnings = true;
  } else {
    console.log(`  ✅ ${varName} - Set`);
  }
});

// Check optional variables
console.log('\n💡 Optional Variables:');
optionalVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`  ℹ️  ${varName} - Not set`);
  } else {
    console.log(`  ✅ ${varName} - Set`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRORS FOUND: Missing required environment variables');
  console.log('   Add these to your Vercel project settings before deploying');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS: Some recommended variables are missing');
  console.log('   Application will work but some features may be limited');
  process.exit(0);
} else {
  console.log('✅ ALL ENVIRONMENT VARIABLES CONFIGURED CORRECTLY');
  process.exit(0);
}
