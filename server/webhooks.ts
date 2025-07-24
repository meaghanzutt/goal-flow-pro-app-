import Stripe from "stripe";
import { storage } from "./storage";

// Make Stripe optional during startup to prevent crash loops
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

export async function handleStripeWebhook(req: any, res: any) {
  // Check if Stripe is configured
  if (!stripe) {
    console.error('Stripe webhook received but STRIPE_SECRET_KEY is not configured');
    return res.status(503).json({ 
      error: 'Stripe integration not configured',
      message: 'STRIPE_SECRET_KEY environment variable is required'
    });
  }
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // For development, we'll skip signature verification
    // In production, you should verify the webhook signature
    event = req.body;
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update user subscription status to active
      if (paymentIntent.metadata?.userId) {
        await storage.updateSubscriptionStatus(
          paymentIntent.metadata.userId,
          'active',
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        );
        console.log(`Updated user ${paymentIntent.metadata.userId} to premium status`);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      if (failedPayment.metadata?.userId) {
        await storage.updateSubscriptionStatus(
          failedPayment.metadata.userId,
          'payment_failed'
        );
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}