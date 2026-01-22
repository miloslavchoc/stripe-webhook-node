import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

export default async function handler(req, res) {
  // povolujeme jen POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  // načtení RAW body
  let rawBody;
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    rawBody = Buffer.concat(chunks);
  } catch {
    return res.status(400).send("Cannot read request body");
  }

  // ověření podpisu
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ZPRACUJEME JEN checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const data = {
      stripe_customer_id: session.customer ?? null,
      stripe_subscription_id: session.subscription ?? null,
      email: session.customer_details?.email ?? null,
      mode: session.mode,
      payment_status: session.payment_status,
      status: session.status,
    };

    // JEN LOG – žádný zápis, žádná DB
    console.log("CHECKOUT SESSION DATA:", data);
  }

  return res.status(200).json({ received: true });
}
