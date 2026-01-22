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
  // Stripe webhook je VŽDY POST
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  let rawBody;
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    rawBody = Buffer.concat(chunks);
  } catch {
    return res.status(400).send("Unable to read request body");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ZATÍM NIC NEUKLÁDÁME – jen potvrzení
  if (event.type === "checkout.session.completed") {
    // připraveno pro další krok
  }

  return res.status(200).json({ received: true });
}
