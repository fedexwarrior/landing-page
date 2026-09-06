
import express from "express";
import Stripe from "stripe";

const app = express();
app.use(express.json());

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
    const { message, messages } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: messages || [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || "No response";

    res.json({ message: replyText });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

app.post(['/create-checkout-session', '/api/create-checkout-session'], async (req, res) => {
  try {
    const { packageId, userId, successUrl, cancelUrl } = req.body;
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);

    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

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
      success_url: successUrl || `${process.env.CLIENT_URL || 'https://velvetcrush.app'}/success`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL || 'https://velvetcrush.app'}/cancel`,
      metadata: {
        userId: userId || 'anonymous',
        packageId: pkg.id,
        credits: pkg.credits.toString(),
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default app;