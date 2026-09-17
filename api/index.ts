import express from "express";
import Stripe from "stripe";

const app = express();
app.use(express.json({ limit: "100kb" })); // reject absurdly large request bodies outright

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const CREDIT_PACKAGES = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },
];

app.post(['/chat', '/api/chat'], async (req, res) => {
  try {
    // --- Input validation ---
    const { message, messages, characterId } = req.body;

    if (message !== undefined && typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message format" });
    }
    if (typeof message === "string" && message.length > 2000) {
      return res.status(400).json({ error: "Message too long" });
    }
    if (characterId !== undefined && typeof characterId !== "string") {
      return res.status(400).json({ error: "Invalid characterId format" });
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage && (!messages || !Array.isArray(messages))) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: messages || [{ role: "user", content: trimmedMessage }],
      }),
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || "No response";

    res.json({ message: replyText });
  } catch (error) {
    const err = error as Error;
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.post(['/create-checkout-session', '/api/create-checkout-session'], async (req, res) => {
  try {
    // --- Input validation ---
    const { packageId, userId, successUrl, cancelUrl } = req.body;

    if (typeof packageId !== "string") {
      return res.status(400).json({ error: "Invalid package" });
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // Only allow redirect URLs on your own domain, so this can't be abused to redirect elsewhere
    const allowedOrigin = process.env.CLIENT_URL || 'https://velvetcrush.app';
    const safeSuccessUrl = typeof successUrl === "string" && successUrl.startsWith(allowedOrigin)
      ? successUrl
      : `${allowedOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const safeCancelUrl = typeof cancelUrl === "string" && cancelUrl.startsWith(allowedOrigin)
      ? cancelUrl
      : `${allowedOrigin}/cancel`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} credits for VelvetCrush`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      metadata: {
        userId: typeof userId === "string" ? userId.slice(0, 200) : 'anonymous',
        packageId: pkg.id,
        credits: pkg.credits.toString(),
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
});

app.get(['/verify-session', '/api/verify-session'], async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: 'Invalid session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const credits = parseInt(session.metadata?.credits || '0', 10);

    res.json({ verified: true, credits });
  } catch (error: any) {
    console.error('Verify session error:', error.message);
    res.status(500).json({ error: "Could not verify payment." });
  }
});

export default app;