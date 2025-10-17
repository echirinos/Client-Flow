import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { requireOwnerSession } from '@/server/ownerAuth';
import { createPaymentLink } from '@/server/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await requireOwnerSession();
    const { invoiceId } = await params;

    // Fetch invoice with job
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        job: {
          select: { orgId: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.job.orgId !== session.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if payment link already exists
    if (invoice.stripePaymentLinkUrl) {
      return NextResponse.json({
        url: invoice.stripePaymentLinkUrl,
      });
    }

    // Create Stripe Payment Link
    const lineItems = invoice.items.map((item) => ({
      price_data: {
        currency: invoice.currency,
        product_data: {
          name: item.description,
        },
        unit_amount: item.unitAmount,
      },
      quantity: item.qty,
    }));

    const paymentLinkUrl = await createPaymentLink({
      lineItems,
      metadata: {
        invoiceId: invoice.id,
        jobId: invoice.jobId,
        orgId: invoice.job.orgId,
      },
    });

    // Update invoice with payment link
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripePaymentLinkUrl: paymentLinkUrl,
        status: 'SENT',
      },
    });

    return NextResponse.json({ url: paymentLinkUrl });
  } catch (error) {
    console.error('Create payment link error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
