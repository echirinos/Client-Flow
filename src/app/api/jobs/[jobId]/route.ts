import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { requireOwnerSession } from '@/server/ownerAuth';
import { createHubSpotAdapter } from '@/server/hubspot/hubspot';
import { updateJobSchema } from '@/lib/validators';

const statusToHubSpotStage: Record<string, string> = {
  NEW: 'appointmentscheduled',
  IN_PROGRESS: 'qualifiedtobuy',
  AWAITING_CLIENT: 'presentationscheduled',
  COMPLETED: 'closedwon',
  CANCELED: 'closedlost',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireOwnerSession();
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.orgId !== session.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireOwnerSession();
    const { jobId } = await params;
    const body = await request.json();
    const input = updateJobSchema.parse(body);

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJob.orgId !== session.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update job
    const job = await prisma.job.update({
      where: { id: jobId },
      data: input,
      include: {
        client: true,
      },
    });

    // If status changed, create system message
    if (input.status && input.status !== existingJob.status) {
      await prisma.message.create({
        data: {
          jobId,
          senderType: 'system',
          body: `Job status changed from ${existingJob.status} to ${input.status}`,
        },
      });

      // Update HubSpot deal if applicable
      if (existingJob.crmExternalId && existingJob.crmProvider === 'hubspot') {
        try {
          const hubspot = createHubSpotAdapter(session.orgId);
          const dealstage = statusToHubSpotStage[input.status] || input.status.toLowerCase();
          await hubspot.updateDeal(existingJob.crmExternalId, {
            dealstage,
          });
        } catch (error) {
          console.error('HubSpot update error:', error);
        }
      }
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await requireOwnerSession();
    const { jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.orgId !== session.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete from HubSpot if applicable
    if (job.crmExternalId && job.crmProvider === 'hubspot') {
      try {
        const hubspot = createHubSpotAdapter(session.orgId);
        await hubspot.deleteDeal(job.crmExternalId);
      } catch (error) {
        console.error('HubSpot delete error:', error);
      }
    }

    // Delete job (cascade will handle related records)
    await prisma.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
