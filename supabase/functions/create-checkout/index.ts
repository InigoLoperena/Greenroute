import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_PERCENT = 20;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const { bid_id, pickup_request_id, amount, bid_type } = await req.json();

    if (!bid_id || !pickup_request_id || amount === undefined || !bid_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const netAmountCents = Math.round(amount * 100);
    const platformFee = Math.round(netAmountCents * (PLATFORM_FEE_PERCENT / 100));
    const amountInCents = netAmountCents + platformFee;

    // Determine description based on bid type
    const description =
      bid_type === "charge_for_removal"
        ? `Pago por servicio de recogida - Puja ${bid_id}`
        : `Pago por objetos - Puja ${bid_id}`;

    // Look up the recipient's Stripe Connect account
    // For charge_for_removal: recipient is the bidder (service provider)
    // For pay_for_removal: recipient is the request owner
    const { data: bidData } = await supabase.from("bids").select("bidder_id").eq("id", bid_id).single();
    const { data: requestData } = await supabase.from("pickup_requests").select("user_id").eq("id", pickup_request_id).single();

    const recipientUserId = bid_type === "charge_for_removal" ? bidData?.bidder_id : requestData?.user_id;

    // Use service role to read stripe_account_id
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let stripeAccountId: string | null = null;
    if (recipientUserId) {
      const { data: recipientProfile } = await serviceClient
        .from("profiles")
        .select("stripe_account_id")
        .eq("user_id", recipientUserId)
        .single();
      stripeAccountId = recipientProfile?.stripe_account_id || null;
    }

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://map-my-route-pal.lovable.app";

    // Build session params
    const sessionParams: any = {
      payment_method_types: ["card"],
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Ecoroute - Servicio de recogida",
              description: `${description} (Comisión plataforma: ${PLATFORM_FEE_PERCENT}% — ${(platformFee/100).toFixed(2)} €)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bid_id,
        pickup_request_id,
        bid_type,
        payer_user_id: userId,
        platform_fee_cents: platformFee.toString(),
        net_amount_cents: netAmountCents.toString(),
      },
      success_url: `${origin}/marketplace/${pickup_request_id}?payment=success`,
      cancel_url: `${origin}/marketplace/${pickup_request_id}?payment=cancelled`,
    };

    // If the recipient has a connected Stripe account, use Connect to split payment
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          bid_id,
          pickup_request_id,
          bid_type,
          payer_user_id: userId,
          platform_fee_cents: platformFee.toString(),
          net_amount_cents: netAmountCents.toString(),
        },
      };
    } else {
      // No connected account — all goes to platform, store metadata for manual payout
      sessionParams.payment_intent_data = {
        metadata: {
          bid_id,
          pickup_request_id,
          bid_type,
          payer_user_id: userId,
          platform_fee_cents: platformFee.toString(),
          net_amount_cents: netAmountCents.toString(),
          needs_manual_payout: "true",
        },
      };
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating checkout:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
