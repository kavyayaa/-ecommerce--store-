require('dotenv').config({ path: './.env' });
console.log('Stripe Key:', process.env.STRIPE_API_KEY);