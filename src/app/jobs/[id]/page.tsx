import { requireOwnerSession } from '@/server/ownerAuth';
import { prisma } from '@/server/prisma';
import MessageList from '@/components/MessageList';
import MessageComposer from '@/components/MessageComposer';
import AttachmentGallery from '@/components/AttachmentGallery';
import StatusUpdater from '@/components/StatusUpdater';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const session = await requireOwnerSession();
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
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

    if (!job || job.orgId !== session.orgId) {
      redirect('/dashboard');
    }

    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';
    const clientPortalUrl = job.clientPortalToken
      ? `${appOrigin}/portal/${job.id}?t=${job.clientPortalToken}`
      : null;

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{session.email}</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600 mt-2">
                  Client: {job.client.name}
                  {job.client.email && ` (${job.client.email})`}
                </p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {job.status.replace(/_/g, ' ')}
              </span>
            </div>
            {job.description && (
              <p className="text-gray-700 mb-4">{job.description}</p>
            )}

            <div className="mt-6">
              <StatusUpdater jobId={job.id} currentStatus={job.status} />
            </div>

            {clientPortalUrl && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Client Portal Link:
                </p>
                <code className="text-sm bg-white px-3 py-2 rounded border block overflow-x-auto">
                  {clientPortalUrl}
                </code>
                <p className="text-xs text-gray-600 mt-2">
                  Copy this link and send it to your client. Valid for 7 days.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
              <div className="mb-6">
                <MessageList messages={job.messages} />
              </div>
              <MessageComposer jobId={job.id} senderType="owner" />
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Attachments
                </h2>
                <AttachmentGallery attachments={job.attachments} />
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Invoices</h2>
                {job.invoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No invoices yet</p>
                ) : (
                  <div className="space-y-4">
                    {job.invoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{invoice.number}</span>
                          <span className="text-sm px-2 py-1 rounded bg-gray-100">
                            {invoice.status}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">
                          ${(invoice.total / 100).toFixed(2)}
                        </p>
                        <div className="space-y-1 text-sm text-gray-600">
                          {invoice.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>
                                {item.description} (×{item.qty})
                              </span>
                              <span>${(item.unitAmount / 100).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {invoice.stripePaymentLinkUrl && (
                          <a
                            href={invoice.stripePaymentLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 block text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            View Payment Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/dashboard');
  }
}
