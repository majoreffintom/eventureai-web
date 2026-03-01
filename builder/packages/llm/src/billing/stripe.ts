import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing from environment variables. Stripe features will be disabled.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as any,
});

export interface StripeSessionOptions {
  tenantId: string | number;
  customerEmail?: string;
  planId?: string;
  successUrl: string;
  cancelUrl: string;
}

export const stripeService = {
  async getOrCreateCustomer(email: string, tenantId: string | number) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) return customers.data[0];

    return stripe.customers.create({
      email,
      metadata: { tenant_id: tenantId.toString() }
    });
  },

  async createSubscriptionSession(options: StripeSessionOptions) {
    const customer = options.customerEmail 
      ? await this.getOrCreateCustomer(options.customerEmail, options.tenantId)
      : null;

    return stripe.checkout.sessions.create({
      customer: customer?.id || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Mori SaaS Base - ' + options.tenantId },
            unit_amount: 999,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }
      ],
      mode: 'subscription',
      metadata: { tenant_id: options.tenantId.toString() },
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
    });
  },

  async reportUsage(subscriptionItemId: string, quantity: number) {
    // Fixed method for Stripe SDK v14+
    return (stripe as any).subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'set',
    });
  }
};
