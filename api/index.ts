import express from "express";
import Stripe from "stripe";
import { Redis } from "@upstash/redis";

const app = express();
app.use(express.json({ limit: "100kb" }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Server's OWN authoritative list of which characters require payment.
// Keep this in sync with src/config/characters.ts (isPremium: true entries).
// The client's claim about a character being premium is NEVER trusted here.
const PREMIUM_CHARACTER_IDS = new Set(["velv-001", "velv-002", "velv-004", "velv-006"]);

const CREDIT_PACKAGES = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },
];

app.post(['/chat', '/api/chat'], async (req, res) => {
  try {
    const { message, messages, characterId, userId } = req.body;

    // --- Input validation ---
    if (message !== undefined && typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message format" });
    }
    if (typeof message === "string" && message.length > 2000) {
      return res.status(400).json({ error: "Message too long" });
    }
    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage && (!messages || !Array.isArray(messages))) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // --- Real, server-side payment check for premium characters ---
    const isPremiumCharacter = typeof characterId === "string" && PREMIUM_CHARACTER_IDS.has(characterId);

    if (isPremiumCharacter) {
      if (typeof userId !== "string" || !userId) {
        return res.status(401).json({ error: "Missing user identity" });
      }

      const currentCredits = await redis.get<number>(`credits:${userId}`) ?? 0;

      if (currentCredits <= 0) {
        return res.status(402).json({ error: "Payment required. Please purchase credits to chat with this companion." });
      }

      // Decrement first; if it goes negative (race condition), put it back and reject.
      const newBalance = await redis.decr(`credits:${userId}`);
      if (newBalance < 0) {
        await redis.incr(`credits:${userId}`);
        return res.status(402).json({ error: "Payment required. Please purchase credits to chat with this companion." });
      }
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
    const { packageId, userId, successUrl, cancelUrl } = req.body;

    if (typeof packageId !== "string") {
      return res.status(400).json({ error: "Invalid package" });
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

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

    // Idempotency: never credit the same Stripe session twice, even if the
    // client calls this endpoint multiple times for the same session_id.
    const alreadyRedeemed = await redis.get(`redeemed:${sessionId}`);
    if (alreadyRedeemed) {
      const userId = alreadyRedeemed as string;
      const currentCredits = await redis.get<number>(`credits:${userId}`) ?? 0;
      return res.json({ verified: true, credits: currentCredits, alreadyRedeemed: true });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
    const userId = session.metadata?.userId || 'anonymous';

    const newBalance = await redis.incrby(`credits:${userId}`, creditsToAdd);
    await redis.set(`redeemed:${sessionId}`, userId, { ex: 60 * 60 * 24 * 30 }); // remember for 30 days

    res.json({ verified: true, credits: newBalance });
  } catch (error: any) {
    console.error('Verify session error:', error.message);
    res.status(500).json({ error: "Could not verify payment." });
  }
});

// Lets the frontend display the real, server-side credit balance instead of
// trusting whatever is sitting in the user's own localStorage.
app.get(['/credits', '/api/credits'], async (req, res) => {
  try {
    const userId = req.query.userId;
    if (typeof userId !== "string" || !userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const credits = await redis.get<number>(`credits:${userId}`) ?? 0;
    res.json({ credits });
  } catch (error: any) {
    console.error('Credits fetch error:', error.message);
    res.status(500).json({ error: "Could not fetch credits." });
  }
});

export default app;