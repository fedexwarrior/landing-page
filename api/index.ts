import express, { Request, Response } from 'express'; import cors from 'cors'; import Stripe from 'stripe'; import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors()); app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''; const stripe = new Stripe(stripeSecretKey);

interface CreditPackage { id: string; credits: number; price: number; name: string; priceFormatted: string; }

const CREDIT_PACKAGES: Record<string, CreditPackage> = { starter: { id: 'starter', credits: 50, price: 500, name: 'Starter Pack', priceFormatted: '$5' }, popular: { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack', priceFormatted: '$10' }, value: { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack', priceFormatted: '$20' }, premium: { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack', priceFormatted: '$50' }, };

app.get('/api/health', (_req: Request, res: Response) => { res.json({ status: 'ok' }); });

app.post('/api/create-checkout-session', async (req: Request, res: Response) => { try { const { packageId, userId, successUrl, cancelUrl } = req.body; const pkg = CREDIT_PACKAGES[packageId];

if (!pkg) {
  res.status(400).json({ error: 'Invalid package selected' });
  return;
}

const defaultClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const finalSuccessUrl = successUrl || `${defaultClientUrl}/success`;
const finalCancelUrl = cancelUrl || `${defaultClientUrl}/cancel`;

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
  success_url: finalSuccessUrl,
  cancel_url: finalCancelUrl,
  metadata: {
    userId: userId || 'anonymous',
    packageId: pkg.id,
    credits: pkg.credits.toString(),
  },
});

res.json({ sessionId: session.id, url: session.url });

} catch (error: any) { console.error('Stripe error:', error); res.status(500).json({ error: error.message || 'Internal server error' }); } });

export default app;
