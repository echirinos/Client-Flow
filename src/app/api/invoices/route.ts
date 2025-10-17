import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { requireOwnerSession } from '@/server/ownerAuth';
import { createInvoiceSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const session = await requireOwnerSession();
    const body = await request.json();
    const input = createInvoiceSchema.parse(body);

    // Verify job exists and belongs to org
    const job = await prisma.job.findUnique({
      where: { id: input.jobId },
      select: { orgId: true },
    });

    if (!job || job.orgId !== session.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Calculate totals
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.qty * item.unitAmount,
      0
    );
    const tax = 0; // Can be calculated based on business logic
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { jobId: input.jobId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        jobId: input.jobId,
        number: invoiceNumber,
        currency: input.currency,
        subtotal,
        tax,
        total,
        status: 'DRAFT',
        items: {
          create: input.items,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
