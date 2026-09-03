import express, { Request, Response } from 'express';
import cors from 'cors';
import Stripe from 'stripe';

const app = express();
app.use(cors());
app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey);

const CREDIT_PACKAGES: Record<string, { id: string; credits: number; price: number; name: string }> = {
  starter: { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  pro: { id: 'pro', credits: 200, price: 1500, name: 'Pro Pack' },
};

app.get(['/api/health', '/health', '/api'], (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post(['/api/create-checkout-session', '/create-checkout-session'], async (req: Request, res: Response) => {
  try {
    const { packageId } = req.body;
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }
    const defaultClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: pkg.name },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: defaultClientUrl + '/success',
      cancel_url: defaultClientUrl + '/cancel',
    });
    return res.json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default app;
