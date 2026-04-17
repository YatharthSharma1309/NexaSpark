const Stripe = require("stripe");
const env = require("../config/env");

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

const createPaymentIntent = async (amount, currency) => {
  if (!stripe) {
    // Fall back for local development when Stripe key is unavailable.
    return {
      id: `mock_pi_${Date.now()}`,
      client_secret: `mock_client_secret_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
    };
  }

  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    automatic_payment_methods: { enabled: true },
  });
};

module.exports = createPaymentIntent;
