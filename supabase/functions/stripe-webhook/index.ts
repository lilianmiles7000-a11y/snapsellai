import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;
    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.subscription_data?.metadata?.supabase_user_id ?? session.metadata?.supabase_user_id;
        if (!userId) break;

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? 'pro' : 'free';

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          plan,
          status: subscription.status,
          renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });

        await supabase.from("profiles").update({
          plan,
          credits_remaining: plan === 'pro' ? 9999 : 5,
          credits_total: plan === 'pro' ? 9999 : 5,
        }).eq("id", userId);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
          // Fallback: look up by stripe_customer_id
          const { data } = await supabase.from("subscriptions").select("user_id").eq("stripe_subscription_id", subscription.id).maybeSingle();
          if (!data) break;
          const uid = data.user_id;
          const isActive = subscription.status === 'active';
          const plan = isActive ? 'pro' : 'free';
          await supabase.from("subscriptions").update({ status: subscription.status, plan, renewal_date: new Date(subscription.current_period_end * 1000).toISOString() }).eq("user_id", uid);
          await supabase.from("profiles").update({ plan, credits_remaining: isActive ? 9999 : 5, credits_total: isActive ? 9999 : 5 }).eq("id", uid);
        } else {
          const isActive = subscription.status === 'active';
          const plan = isActive ? 'pro' : 'free';
          await supabase.from("subscriptions").update({ status: subscription.status, plan, renewal_date: new Date(subscription.current_period_end * 1000).toISOString() }).eq("user_id", userId);
          await supabase.from("profiles").update({ plan, credits_remaining: isActive ? 9999 : 5, credits_total: isActive ? 9999 : 5 }).eq("id", userId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
