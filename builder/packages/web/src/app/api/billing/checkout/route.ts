import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@eventureai/builder-llm";

export async function POST(req: NextRequest) {
  try {
    const { planId, tenantId, customerEmail } = await req.json();

    const origin = req.headers.get("origin") || "https://eventureai.com";

    const session = await stripeService.createSubscriptionSession({
      tenantId: tenantId || "default",
      customerEmail: customerEmail,
      planId: planId,
      successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/billing`,
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
