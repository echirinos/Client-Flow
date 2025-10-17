import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { getOwnerSession } from '@/server/ownerAuth';
import { validateClientAccess } from '@/server/clientMagicLink';
import { generatePresignedUploadUrl, validateMimeType } from '@/server/s3';
import { presignAttachmentSchema } from '@/lib/validators';
import { createId } from '@paralleldrive/cuid2';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const input = presignAttachmentSchema.parse(body);

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

    // Validate MIME type
    if (!validateMimeType(input.contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Generate file key
    const fileId = createId();
    const fileExtension = input.contentType.split('/')[1];
    const fileKey = `jobs/${jobId}/${fileId}.${fileExtension}`;

    // Generate presigned URL
    const { uploadUrl } = await generatePresignedUploadUrl(
      fileKey,
      input.contentType
    );

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        jobId,
        fileKey,
        mimeType: input.contentType,
        uploadedByClient: isClientAccess || input.uploadedByClient || false,
        uploadedByUserId: ownerSession ? ownerSession.userId : null,
      },
    });

    return NextResponse.json({
      uploadUrl,
      fileKey,
      attachmentId: attachment.id,
    });
  } catch (error) {
    console.error('Presign attachment error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
