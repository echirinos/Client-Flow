import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { getOwnerSession } from '@/server/ownerAuth';
import { validateClientAccess } from '@/server/clientMagicLink';
import { createMessageSchema } from '@/lib/validators';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const clientToken = searchParams.get('t');

    // Check owner session or client token
    const ownerSession = await getOwnerSession();
    const isClientAccess = clientToken
      ? await validateClientAccess(clientToken, jobId)
      : false;

    if (!ownerSession && !isClientAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify job exists and belongs to org (for owner access)
    if (ownerSession) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { orgId: true },
      });

      if (!job || job.orgId !== ownerSession.orgId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    const messages = await prisma.message.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const input = createMessageSchema.parse(body);

    const { searchParams } = new URL(request.url);
    const clientToken = searchParams.get('t');

    // Check owner session or client token
    const ownerSession = await getOwnerSession();
    const isClientAccess = clientToken
      ? await validateClientAccess(clientToken, jobId)
      : false;

    if (!ownerSession && !isClientAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify job exists and belongs to org (for owner access)
    if (ownerSession) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { orgId: true },
      });

      if (!job || job.orgId !== ownerSession.orgId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Validate sender type matches access
    if (isClientAccess && input.senderType !== 'client') {
      return NextResponse.json(
        { error: 'Invalid sender type for client' },
        { status: 400 }
      );
    }

    if (ownerSession && input.senderType === 'client') {
      return NextResponse.json(
        { error: 'Invalid sender type for owner' },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        jobId,
        senderType: input.senderType,
        body: input.body,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
