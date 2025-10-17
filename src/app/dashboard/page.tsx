import { requireOwnerSession } from '@/server/ownerAuth';
import { prisma } from '@/server/prisma';
import JobList from '@/components/JobList';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    const session = await requireOwnerSession();
    const { status } = await searchParams;

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

    const jobCounts = await prisma.job.groupBy({
      by: ['status'],
      where: {
        orgId: session.orgId,
      },
      _count: true,
    });

    const statusCounts = jobCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-2xl font-bold text-gray-900">ClientFlow</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{session.email}</span>
                <form action="/api/auth/owner/logout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Jobs</h2>
              <p className="text-gray-600 mt-1">
                Manage your client jobs and projects
              </p>
            </div>
            <Link
              href="/jobs/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Job
            </Link>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                !status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:border-blue-500'
              }`}
            >
              All ({jobs.length})
            </Link>
            {['NEW', 'IN_PROGRESS', 'AWAITING_CLIENT', 'COMPLETED', 'CANCELED'].map(
              (s) => (
                <Link
                  key={s}
                  href={`/dashboard?status=${s}`}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border hover:border-blue-500'
                  }`}
                >
                  {s.replace(/_/g, ' ')} ({statusCounts[s] || 0})
                </Link>
              )
            )}
          </div>

          <JobList jobs={jobs} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
