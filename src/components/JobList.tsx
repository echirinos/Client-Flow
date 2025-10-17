'use client';

import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  client: {
    name: string;
    email: string | null;
  };
}

interface JobListProps {
  jobs: Job[];
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  AWAITING_CLIENT: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-gray-100 text-gray-800',
};

export default function JobList({ jobs }: JobListProps) {
  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No jobs found. Create your first job!</p>
        </div>
      ) : (
        jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block bg-white p-6 rounded-lg border hover:border-blue-500 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Client: {job.client.name}
                  {job.client.email && ` (${job.client.email})`}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Created: {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusColors[job.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {job.status.replace(/_/g, ' ')}
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
