import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const CREDIT_PACKAGES = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack', priceFormatted: '$5.00' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack', priceFormatted: '$10.00' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack', priceFormatted: '$20.00' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack', priceFormatted: '$50.00' },
];

app.post('/api/create-checkout-session', async (req, res) => {
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
      success_url: successUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/success`,
      cancel_url: cancelUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/cancel`,
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
