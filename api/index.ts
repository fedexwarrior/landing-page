import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();

app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

// Available credit packages
const CREDIT_PACKAGES: Record<string, { id: string; credits: number; price: number; name: string }> = {
  starter: { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },   // $5.00
  pro: { id: 'pro', credits: 200, price: 1500, name: 'Pro Pack' },             // $15.00
  whale: { id: 'whale', credits: 1000, price: 5000, name: 'Whale Pack' },      // $50.00
};

// Stripe Checkout Session Endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { packageId } = req.body;
    const selectedPackage = CREDIT_PACKAGES[packageId] || CREDIT_PACKAGES['pro'];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits} Credits`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

// OpenRouter Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { character, messages } = req.body;

  const systemPrompt = {
    role: 'system',
    content: `You are ${character || 'Velvet'}, a charming, sweet, and slightly bashful conversational partner. Keep replies between 1-3 sentences, PG-13, engaging, and always end with a light question back to the user.`
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        messages: [systemPrompt, ...(messages || [])],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I lost my train of thought!";
    res.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;