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

const chatRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "ratelimit:chat" });
const checkoutRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "ratelimit:checkout" });
const authRateLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "ratelimit:auth" });

const CREDIT_PACKAGES = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },
];

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
  try {
    const ip = getClientIp(req);
    const { success } = await chatRateLimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many requests. Please slow down and try again in a minute." });

    const userId = await getUserIdFromSession(req);
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

    res.json({ message: replyText, credits: newBalance });
  } catch (error) {
    const err = error as Error;
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
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
    await redis.set(`redeemed:${sessionId}`, userId, { ex: 60 * 60 * 24 * 30 });
    res.json({ verified: true, credits: newBalance });
  } catch (error: any) {
    console.error('Verify session error:', error.message);
    res.status(500).json({ error: "Could not verify payment." });
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

export default app;