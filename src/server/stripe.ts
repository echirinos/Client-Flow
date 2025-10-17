import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export interface CreatePaymentLinkParams {
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  metadata?: Record<string, string>;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<string> {
  const paymentLink = await stripe.paymentLinks.create({
    line_items: params.lineItems,
    metadata: params.metadata,
  });

  return paymentLink.url;
}

export { stripe };
