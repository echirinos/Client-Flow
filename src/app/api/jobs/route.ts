import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { requireOwnerSession } from '@/server/ownerAuth';
import { generateClientMagicLink } from '@/server/clientMagicLink';
import { createHubSpotAdapter } from '@/server/hubspot/hubspot';
import { createJobSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const session = await requireOwnerSession();
    const body = await request.json();
    const input = createJobSchema.parse(body);

    // Verify user belongs to organization
    if (session.orgId !== input.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Upsert client
    const client = await prisma.client.upsert({
      where: {
        orgId_email: {
          orgId: input.orgId,
          email: input.clientEmail || '',
        },
      },
      update: {
        name: input.clientName,
      },
      create: {
        orgId: input.orgId,
        name: input.clientName,
        email: input.clientEmail,
      },
    });

    // Create job
    const job = await prisma.job.create({
      data: {
        orgId: input.orgId,
        clientId: client.id,
        title: input.title,
        description: input.description,
        status: 'NEW',
      },
      include: {
        client: true,
      },
    });

    // HubSpot integration
    let crmExternalId: string | null = null;
    try {
      const hubspot = createHubSpotAdapter(input.orgId);

      // Create contact if email present
      let contactId: string | undefined;
      if (input.clientEmail) {
        const nameParts = input.clientName.split(' ');
        const firstname = nameParts[0] || '';
        const lastname = nameParts.slice(1).join(' ') || '';

        const contact = await hubspot.createContact({
          email: input.clientEmail,
          firstname,
          lastname,
        });
        contactId = contact.id;
      }

      // Create deal
      const deal = await hubspot.createDeal({
        dealname: input.title,
        pipeline: input.pipeline,
        dealstage: input.dealstage,
        associations: contactId ? { contacts: [contactId] } : undefined,
      });

      crmExternalId = deal.id;

      // Update job with CRM info
      await prisma.job.update({
        where: { id: job.id },
        data: {
          crmProvider: 'hubspot',
          crmExternalId: deal.id,
        },
      });
    } catch (error) {
      console.error('HubSpot integration error:', error);
      // Continue without HubSpot
    }

    // Generate client portal link
    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';
    const clientPortalUrl = await generateClientMagicLink(
      job.id,
      input.clientEmail || '',
      appOrigin
    );

    // Update job with portal token
    await prisma.job.update({
      where: { id: job.id },
      data: {
        clientPortalToken: clientPortalUrl.split('?t=')[1],
      },
    });

    return NextResponse.json({
      job: {
        ...job,
        crmExternalId,
      },
      clientPortalUrl,
    });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireOwnerSession();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      orgId: session.orgId,
    };

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
