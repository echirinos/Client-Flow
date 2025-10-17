import { prisma } from '@/server/prisma';
import { validateClientAccess } from '@/server/clientMagicLink';
import MessageList from '@/components/MessageList';
import MessageComposer from '@/components/MessageComposer';
import AttachmentGallery from '@/components/AttachmentGallery';
import { redirect } from 'next/navigation';

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            No access token provided. Please use the link sent to you by email.
          </p>
        </div>
      </div>
    );
  }

  const hasAccess = await validateClientAccess(token, id);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            Invalid or expired access token. Please contact support.
          </p>
        </div>
      </div>
    );
  }

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
        where: {
          status: {
            in: ['SENT', 'PAID'],
          },
        },
      },
    },
  });

  if (!job) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
            <span className="text-sm text-gray-600">{job.client.name}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              {job.description && (
                <p className="text-gray-700 mt-2">{job.description}</p>
              )}
            </div>
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {job.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
            <div className="mb-6">
              <MessageList messages={job.messages} />
            </div>
            <MessageComposer
              jobId={job.id}
              senderType="client"
              clientToken={token}
            />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Attachments</h2>
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
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            invoice.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        ${(invoice.total / 100).toFixed(2)}
                      </p>
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        {invoice.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>
                              {item.description} (×{item.qty})
                            </span>
                            <span>${(item.unitAmount / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      {invoice.stripePaymentLinkUrl && invoice.status !== 'PAID' && (
                        <a
                          href={invoice.stripePaymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Pay Now
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
}
