'use client';

import { getPublicUrl } from '@/server/s3';

interface Attachment {
  id: string;
  fileKey: string;
  mimeType: string;
  uploadedByClient: boolean;
  createdAt: string;
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
}

export default function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const getUrl = (fileKey: string) => {
    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${fileKey}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {attachments.length === 0 ? (
        <p className="text-gray-500 col-span-full text-center py-8">No attachments yet</p>
      ) : (
        attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {attachment.mimeType.startsWith('image/') ? (
              <img
                src={getUrl(attachment.fileKey)}
                alt="Attachment"
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            <div className="p-2 bg-white">
              <p className="text-xs text-gray-500 truncate">
                {attachment.uploadedByClient ? 'Client' : 'Owner'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(attachment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
