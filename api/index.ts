import express from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { OAuth2Client } from "google-auth-library";

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const SESSION_COOKIE = "vc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SIGNUP_BONUS_CREDITS = 20;
const COST_PER_MESSAGE = 5;
const COST_PER_IMAGE = 30;

const chatRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "ratelimit:chat" });
const checkoutRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "ratelimit:checkout" });
const authRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "ratelimit:auth" });
const imageRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "ratelimit:image" });
const webhookRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "ratelimit:webhook" });

const CREDIT_PACKAGES = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },
];

// Allowed image options. These must match the values in ImageGeneration.tsx exactly.
const ALLOWED_IMAGE_OPTIONS: Record<string, string[]> = {
  eyeColor: ['blue', 'green', 'brown', 'hazel', 'violet', 'amber', 'gray', 'heterochromia'],
  eyeShape: ['almond', 'round', 'hooded', 'upturned', 'downturned', 'monolid'],
  bodyType: ['slim', 'tall'],
  outfit: ['one-piece', 'sundress', 'cover-up', 'shorts-tank', 'sarong'],
  setting: ['beach', 'poolside', 'sunset', 'tropical-garden', 'luxury-resort'],
};

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

// --- Session helpers: identity ALWAYS comes from this cookie, never from the request body ---
async function getUserIdFromSession(req: express.Request): Promise<string | null> {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId) return null;
  const userId = await redis.get<string>(`session:${sessionId}`);
  return userId || null;
}

async function createSession(res: express.Response, googleSub: string) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  await redis.set(`session:${sessionId}`, googleSub, { ex: SESSION_TTL_SECONDS });
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

// --- Stripe: give credits for a paid checkout session ---
// Used by BOTH the success page (/verify-session) and the Stripe webhook.
// Safe to call any number of times: the redeemed:<sessionId> marker is claimed
// atomically (nx), so the credits are only ever added once per purchase.
async function redeemCheckoutSession(sessionId: string) {
  // Always ask Stripe directly whether this session is really paid
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { status: "unpaid" as const };

  const userId = session.metadata?.userId;
  const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);
  if (!userId || !creditsToAdd) return { status: "invalid" as const };

  const claimed = await redis.set(`redeemed:${sessionId}`, userId, { nx: true });
  if (!claimed) {
    const credits = await redis.get<number>(`credits:${userId}`) ?? 0;
    return { status: "already" as const, credits };
  }

  try {
    const credits = await redis.incrby(`credits:${userId}`, creditsToAdd);
    return { status: "credited" as const, credits };
  } catch (err) {
    await redis.del(`redeemed:${sessionId}`); // let a retry try again
    throw err;
  }
}

// --- AUTH ---

app.post(['/auth/google', '/api/auth/google'], async (req, res) => {
  try {
    const ip = getClientIp(req);
    const { success } = await authRateLimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many attempts. Please wait a minute." });

    const { idToken } = req.body;
    if (typeof idToken !== "string" || !idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const googleSub = payload.sub;
    const email = payload.email;
    const name = payload.name || email;

    const existingUser = await redis.get(`user:${googleSub}`);
    if (!existingUser) {
      await redis.set(`user:${googleSub}`, JSON.stringify({ email, name, createdAt: Date.now() }));
      await redis.set(`credits:${googleSub}`, SIGNUP_BONUS_CREDITS);
    }

    await createSession(res, googleSub);

    const credits = await redis.get<number>(`credits:${googleSub}`) ?? 0;
    res.json({ email, name, credits, isNewUser: !existingUser });
  } catch (error: any) {
    console.error("Google auth error:", error.message);
    res.status(401).json({ error: "Could not verify Google sign-in" });
  }
});

app.get(['/auth/me', '/api/auth/me'], async (req, res) => {
  try {
    const userId = await getUserIdFromSession(req);
    if (!userId) return res.status(401).json({ error: "Not signed in" });

    const userRaw = await redis.get<string>(`user:${userId}`);
    if (!userRaw) return res.status(401).json({ error: "Not signed in" });

    const user = typeof userRaw === "string" ? JSON.parse(userRaw) : userRaw;
    const credits = await redis.get<number>(`credits:${userId}`) ?? 0;
    res.json({ email: user.email, name: user.name, credits });
  } catch (error: any) {
    console.error("Auth check error:", error.message);
    res.status(500).json({ error: "Could not check session" });
  }
});

app.post(['/auth/logout', '/api/auth/logout'], async (req, res) => {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId) await redis.del(`session:${sessionId}`);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error.message);
    res.status(500).json({ error: "Could not log out" });
  }
});

// --- CHAT: requires a real session. Never touches OpenRouter for a signed-out visitor. ---

app.post(['/chat', '/api/chat'], async (req, res) => {
  // Declared out here (outside the try) so the catch block can see them — same
  // charged/refund pattern used for image generation.
  let userId: string | null = null;
  let charged = false;

  try {
    const ip = getClientIp(req);
    const { success } = await chatRateLimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many requests. Please slow down and try again in a minute." });

    userId = await getUserIdFromSession(req);
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to chat." });
    }

    const { message, messages, characterId } = req.body;

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

    const currentCredits = await redis.get<number>(`credits:${userId}`) ?? 0;
    if (currentCredits < COST_PER_MESSAGE) {
      return res.status(402).json({ error: "Not enough credits. Please top up to keep chatting." });
    }

    const newBalance = await redis.decrby(`credits:${userId}`, COST_PER_MESSAGE);
    if (newBalance < 0) {
      await redis.incrby(`credits:${userId}`, COST_PER_MESSAGE);
      return res.status(402).json({ error: "Not enough credits. Please top up to keep chatting." });
    }
    charged = true; // credits are now taken; refund them if anything goes wrong below

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

    if (!response.ok) {
      await redis.incrby(`credits:${userId}`, COST_PER_MESSAGE);
      charged = false;
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return res.status(502).json({ error: "Something went wrong. Your credits were refunded. Please try again." });
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content;

    if (!replyText) {
      await redis.incrby(`credits:${userId}`, COST_PER_MESSAGE);
      charged = false;
      return res.status(502).json({ error: "Something went wrong. Your credits were refunded. Please try again." });
    }

    charged = false; // success, nothing to refund
    res.json({ message: replyText, credits: newBalance });
  } catch (error) {
    const err = error as Error;
    console.error("Chat error:", err.message);
    if (charged && userId) await redis.incrby(`credits:${userId}`, COST_PER_MESSAGE);
    res.status(500).json({ error: "Something went wrong. Your credits were refunded. Please try again." });
  }
});

// --- CHECKOUT: also requires a real session; identity comes from the cookie, not the client ---

app.post(['/create-checkout-session', '/api/create-checkout-session'], async (req, res) => {
  try {
    const ip = getClientIp(req);
    const { success } = await checkoutRateLimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many checkout attempts. Please wait a minute and try again." });

    const userId = await getUserIdFromSession(req);
    if (!userId) {
      return res.status(401).json({ error: "Please sign in before purchasing credits." });
    }

    const { packageId, successUrl, cancelUrl } = req.body;

    if (typeof packageId !== "string") return res.status(400).json({ error: "Invalid package" });
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    const allowedOrigin = process.env.CLIENT_URL || 'https://velvetcrush.app';
    const safeSuccessUrl = typeof successUrl === "string" && successUrl.startsWith(allowedOrigin)
      ? successUrl
      : `${allowedOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const safeCancelUrl = typeof cancelUrl === "string" && cancelUrl.startsWith(allowedOrigin)
      ? cancelUrl
      : `${allowedOrigin}/cancel`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: pkg.name, description: `${pkg.credits} credits for VelvetCrush` },
          unit_amount: pkg.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      metadata: {
        userId, // from the verified session — never from the client
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
    const result = await redeemCheckoutSession(sessionId);
    if (result.status === "unpaid") return res.status(400).json({ error: 'Payment not completed' });
    if (result.status === "invalid") return res.status(400).json({ error: 'Invalid session' });
    if (result.status === "already") {
      return res.json({ verified: true, credits: result.credits, alreadyRedeemed: true });
    }
    res.json({ verified: true, credits: result.credits });
  } catch (error: any) {
    console.error('Verify session error:', error.message);
    res.status(500).json({ error: "Could not verify payment." });
  }
});

// --- STRIPE WEBHOOK: credits buyers even if they close the tab before the success page loads ---
// We never trust the webhook body itself. We only read the session id from it, then ask
// Stripe directly whether that session is paid (see redeemCheckoutSession).
app.post(['/stripe-webhook', '/api/stripe-webhook'], async (req, res) => {
  try {
    const ip = getClientIp(req);
    const { success } = await webhookRateLimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many requests" });

    const event = req.body;
    const sessionId = event?.data?.object?.id;
    if (
      event?.type === "checkout.session.completed" &&
      typeof sessionId === "string" &&
      sessionId.startsWith("cs_")
    ) {
      await redeemCheckoutSession(sessionId);
    }
    res.json({ received: true });
  } catch (error: any) {
    if (error?.code === "resource_missing") {
      // Stripe has no such session (e.g. a dashboard "test event"); retrying won't help
      return res.json({ received: true, ignored: true });
    }
    console.error("Stripe webhook error:", error.message);
    res.status(500).json({ error: "Webhook failed" }); // Stripe will retry automatically
  }
});

app.get(['/credits', '/api/credits'], async (req, res) => {
  try {
    const userId = await getUserIdFromSession(req);
    if (!userId) return res.status(401).json({ error: "Not signed in" });
    const credits = await redis.get<number>(`credits:${userId}`) ?? 0;
    res.json({ credits });
  } catch (error: any) {
    console.error('Credits fetch error:', error.message);
    res.status(500).json({ error: "Could not fetch credits." });
  }
});

// --- IMAGE GENERATION: requires a real session; identity from cookie; deduct 30 credits ---
app.post(['/generate-image', '/api/generate-image'], async (req, res) => {
  // Declared out here (outside the try) so the catch block can see them
  let userId: string | null = null;
  let charged = false;

  try {
    const ip = getClientIp(req);
    const { success } = await imageRateLimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many image generation requests. Please wait a minute and try again." });

    userId = await getUserIdFromSession(req);
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to generate images." });
    }

    const { style, eyeColor, eyeShape, bodyType, outfit, setting } = req.body;

    if (typeof style !== "string" || !["realistic", "anime"].includes(style)) {
      return res.status(400).json({ error: "Invalid style. Must be 'realistic' or 'anime'." });
    }

    // Every other choice must be one of the allowed values (checked before any credits are taken)
    const choices: Record<string, unknown> = { eyeColor, eyeShape, bodyType, outfit, setting };
    for (const [field, allowed] of Object.entries(ALLOWED_IMAGE_OPTIONS)) {
      const value = choices[field];
      if (typeof value !== "string" || !allowed.includes(value)) {
        return res.status(400).json({ error: `Invalid ${field}.` });
      }
    }

    const currentCredits = await redis.get<number>(`credits:${userId}`) ?? 0;
    if (currentCredits < COST_PER_IMAGE) {
      return res.status(402).json({ error: "Not enough credits. Please top up to generate images." });
    }

    const newBalance = await redis.decrby(`credits:${userId}`, COST_PER_IMAGE);
    if (newBalance < 0) {
      await redis.incrby(`credits:${userId}`, COST_PER_IMAGE);
      return res.status(402).json({ error: "Not enough credits. Please top up to generate images." });
    }
    charged = true; // credits are now taken; refund them if anything goes wrong below

    // --- Build the actual prompt from the person's choices ---
    // Values are already validated above; this just turns "one-piece" into "one piece", etc.
    const words = (v: string) => v.replace(/-/g, " ");

    // Fashion-catalog framing should help more pictures pass fal's safety filter
    const framing = "tasteful resort fashion editorial, waist-up portrait framing, relaxed natural pose";
    const styleDescriptor = style === "anime"
      ? `anime illustration style, cel-shaded, vibrant anime art, ${framing}`
      : `photorealistic CGI blend, magazine quality render, ${framing}, realistic skin and lighting`;

    const promptParts = [
      "attractive adult woman",
      `${words(eyeColor)} eyes`,
      `${words(eyeShape)} eye shape`,
      `${words(bodyType)} body type`,
      `wearing ${words(outfit)}`,
      `${words(setting)} setting`,
      styleDescriptor,
    ].join(", ");

    // --- Call fal.ai to actually generate the image ---
    // The model uses a random seed each call, so a picture that gets flagged once
    // can come out fine on a second try with the exact same prompt. We attempt
    // up to 2 times before refunding, so a person's chosen options rarely fail
    // just because of one unlucky render.
    const MAX_ATTEMPTS = 2;
    let falData: any = null;
    let flaggedBySafetyFilter = false;
    let imageUrl: string | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const falResponse = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptParts,
          image_size: "portrait_4_3",
          num_images: 1,
        }),
      });

      if (!falResponse.ok) {
        await redis.incrby(`credits:${userId}`, COST_PER_IMAGE);
        charged = false;
        const errText = await falResponse.text();
        console.error("fal.ai error:", errText);
        return res.status(502).json({ error: "Image generation failed. Your credits were refunded." });
      }

      falData = await falResponse.json();
      imageUrl = falData.images?.[0]?.url;
      // fal's safety filter swaps a flagged picture for a plain black image instead of failing
      flaggedBySafetyFilter = falData.has_nsfw_concepts?.[0] === true;

      if (imageUrl && !flaggedBySafetyFilter) break; // success, stop retrying
    }

    // Keep simple counters so we can see which options get blocked most.
    // In Upstash's Data Browser: "image_choice_totals" = every finished generation,
    // "safety_blocks" = the blocked ones. Compare the numbers for each option.
    if (imageUrl) {
      const choiceKeys = [
        `style:${style}`, `eyeColor:${eyeColor}`, `eyeShape:${eyeShape}`,
        `bodyType:${bodyType}`, `outfit:${outfit}`, `setting:${setting}`,
      ];
      const bump = async (hash: string) => {
        try {
          await Promise.all(choiceKeys.map((k) => redis.hincrby(hash, k, 1)));
        } catch (e) {
          console.error("Could not update", hash);
        }
      };
      await bump("image_choice_totals");
      if (flaggedBySafetyFilter) await bump("safety_blocks");
    }

    if (!imageUrl || flaggedBySafetyFilter) {
      await redis.incrby(`credits:${userId}`, COST_PER_IMAGE);
      charged = false;
      return res.status(flaggedBySafetyFilter ? 422 : 502).json({
        error: flaggedBySafetyFilter
          ? "That combination was blocked by the safety filter. Your credits were refunded. Try a different outfit or setting."
          : "Image generation failed. Your credits were refunded.",
      });
    }

    charged = false; // success, nothing to refund
    res.json({ imageUrl, credits: newBalance, prompt: { style, eyeColor, eyeShape, bodyType, outfit, setting } });
  } catch (error) {
    const err = error as Error;
    console.error("Image generation error:", err.message);
    if (charged && userId) await redis.incrby(`credits:${userId}`, COST_PER_IMAGE);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default app;