import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    // In production, you'd verify the webhook signature here
    // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    // For now, parse the JSON directly
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log(`🔔 Stripe webhook received: ${event.type}`);

    // Store the event for processing
    await sql`
      INSERT INTO stripe_events (stripe_event_id, event_type, event_data)
      VALUES (${event.id}, ${event.type}, ${JSON.stringify(event)})
      ON CONFLICT (stripe_event_id) DO NOTHING
    `;

    // Process the event
    await processStripeEvent(event);

    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function processStripeEvent(event) {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionCanceled(event.data.object);
        break;

      case "customer.created":
      case "customer.updated":
        await handleCustomerChange(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await sql`
      UPDATE stripe_events 
      SET processed = true, processed_at = CURRENT_TIMESTAMP 
      WHERE stripe_event_id = ${event.id}
    `;
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);

    // Mark event as failed
    await sql`
      UPDATE stripe_events 
      SET processed = false, processing_error = ${error.message}
      WHERE stripe_event_id = ${event.id}
    `;
  }
}

async function handlePaymentSuccess(paymentIntent) {
  // Find or create customer
  let customer = await findOrCreateCustomer(paymentIntent.customer);

  // Determine which app this payment is for (you'd have metadata or other logic)
  const app_id = await determineAppFromPayment(paymentIntent);
  const revenue_category_id = await getDefaultRevenueCategoryId();

  // Create transaction record
  const [transaction] = await sql`
    INSERT INTO transactions (
      transaction_id, customer_id, app_id, transaction_type, amount, 
      net_amount, fees, currency, payment_method, payment_source, 
      status, description, metadata, transaction_date, processed_date,
      revenue_category_id
    ) VALUES (
      ${paymentIntent.id},
      ${customer.id},
      ${app_id},
      'revenue',
      ${paymentIntent.amount / 100}, -- Stripe amounts are in cents
      ${paymentIntent.amount_received / 100},
      ${(paymentIntent.amount - paymentIntent.amount_received) / 100},
      ${paymentIntent.currency.toUpperCase()},
      'stripe',
      ${paymentIntent.payment_method_types?.[0] || "card"},
      'completed',
      ${paymentIntent.description || "Stripe payment"},
      ${JSON.stringify(paymentIntent)},
      ${new Date().toISOString().split("T")[0]},
      ${new Date().toISOString()},
      ${revenue_category_id}
    )
    RETURNING *
  `;

  console.log(
    `💰 Payment recorded: $${transaction.amount} from ${customer.email}`,
  );
  return transaction;
}

async function handleInvoicePaid(invoice) {
  // Update invoice status if it exists in our system
  await sql`
    UPDATE invoices 
    SET status = 'paid', paid_date = CURRENT_DATE
    WHERE stripe_invoice_id = ${invoice.id}
  `;

  // If invoice doesn't exist, create transaction
  if (invoice.subscription) {
    await handleSubscriptionPayment(invoice);
  }
}

async function handleSubscriptionChange(subscription) {
  const customer = await findOrCreateCustomer(subscription.customer);
  const app_id = await determineAppFromSubscription(subscription);

  // Calculate MRR and ARR
  const monthlyAmount = subscription.items.data.reduce((sum, item) => {
    const price = item.price.unit_amount / 100;
    const quantity = item.quantity;

    // Convert to monthly amount
    if (item.price.recurring.interval === "year") {
      return sum + (price * quantity) / 12;
    } else if (item.price.recurring.interval === "month") {
      return sum + price * quantity;
    }
    return sum;
  }, 0);

  const mrr = monthlyAmount;
  const arr = monthlyAmount * 12;

  await sql`
    INSERT INTO subscriptions (
      stripe_subscription_id, customer_id, app_id, plan_name, plan_price,
      billing_interval, status, current_period_start, current_period_end,
      cancel_at_period_end, mrr, arr
    ) VALUES (
      ${subscription.id},
      ${customer.id},
      ${app_id},
      ${subscription.items.data[0]?.price?.nickname || "Default Plan"},
      ${subscription.items.data[0]?.price?.unit_amount / 100 || 0},
      ${subscription.items.data[0]?.price?.recurring?.interval || "monthly"},
      ${subscription.status},
      ${new Date(subscription.current_period_start * 1000).toISOString().split("T")[0]},
      ${new Date(subscription.current_period_end * 1000).toISOString().split("T")[0]},
      ${subscription.cancel_at_period_end},
      ${mrr},
      ${arr}
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      mrr = EXCLUDED.mrr,
      arr = EXCLUDED.arr,
      updated_at = CURRENT_TIMESTAMP
  `;

  console.log(`📋 Subscription updated: ${subscription.id} - MRR: $${mrr}`);
}

async function handleSubscriptionCanceled(subscription) {
  await sql`
    UPDATE subscriptions 
    SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, mrr = 0, arr = 0
    WHERE stripe_subscription_id = ${subscription.id}
  `;

  console.log(`❌ Subscription cancelled: ${subscription.id}`);
}

async function handleCustomerChange(customer) {
  await sql`
    INSERT INTO customers (
      stripe_customer_id, business_name, contact_name, email, phone,
      billing_address, metadata
    ) VALUES (
      ${customer.id},
      ${customer.name},
      ${customer.name},
      ${customer.email},
      ${customer.phone},
      ${JSON.stringify(customer.address || {})},
      ${JSON.stringify(customer.metadata || {})}
    )
    ON CONFLICT (stripe_customer_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      contact_name = EXCLUDED.contact_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      billing_address = EXCLUDED.billing_address,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP
  `;
}

async function handlePaymentFailed(invoice) {
  console.log(`❌ Payment failed for invoice: ${invoice.id}`);
  // You might want to send notifications, update customer status, etc.
}

async function findOrCreateCustomer(stripeCustomerId) {
  if (!stripeCustomerId) return null;

  // Try to find existing customer
  let [customer] = await sql`
    SELECT * FROM customers WHERE stripe_customer_id = ${stripeCustomerId}
  `;

  if (!customer) {
    // Create placeholder customer - webhook should have customer data
    [customer] = await sql`
      INSERT INTO customers (stripe_customer_id, email, contact_name)
      VALUES (${stripeCustomerId}, ${stripeCustomerId + "@placeholder.com"}, 'Unknown Customer')
      RETURNING *
    `;
  }

  return customer;
}

async function determineAppFromPayment(paymentIntent) {
  // You can use metadata or other logic to determine which app the payment is for
  // For now, return EVENTEREAI's main app (you'd have this stored)
  const [app] = await sql`
    SELECT id FROM apps WHERE name = 'EVENTEREAI' OR app_type = 'internal' LIMIT 1
  `;

  return app?.id || null;
}

async function determineAppFromSubscription(subscription) {
  // Similar logic to payment but for subscriptions
  const [app] = await sql`
    SELECT id FROM apps WHERE name = 'EVENTEREAI' OR app_type = 'internal' LIMIT 1
  `;

  return app?.id || null;
}

async function getDefaultRevenueCategoryId() {
  const [category] = await sql`
    SELECT id FROM revenue_categories WHERE name = 'EVENTEREAI Core Services' LIMIT 1
  `;

  return category?.id || null;
}

async function handleSubscriptionPayment(invoice) {
  // Handle recurring subscription payments
  const customer = await findOrCreateCustomer(invoice.customer);
  const app_id = await determineAppFromSubscription({
    customer: invoice.customer,
  });
  const revenue_category_id = await getDefaultRevenueCategoryId();

  await sql`
    INSERT INTO transactions (
      transaction_id, customer_id, app_id, transaction_type, amount, 
      net_amount, currency, payment_method, status, description, 
      metadata, transaction_date, processed_date, revenue_category_id
    ) VALUES (
      ${invoice.id},
      ${customer.id},
      ${app_id},
      'revenue',
      ${invoice.amount_paid / 100},
      ${invoice.amount_paid / 100}, -- TODO: Calculate actual net after fees
      ${invoice.currency.toUpperCase()},
      'stripe',
      'completed',
      'Subscription payment',
      ${JSON.stringify(invoice)},
      ${new Date().toISOString().split("T")[0]},
      ${new Date().toISOString()},
      ${revenue_category_id}
    )
  `;
}
