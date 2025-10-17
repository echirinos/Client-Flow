'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusUpdaterProps {
  jobId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'AWAITING_CLIENT', label: 'Awaiting Client', color: 'bg-purple-100 text-purple-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELED', label: 'Canceled', color: 'bg-gray-100 text-gray-800' },
];

export default function StatusUpdater({ jobId, currentStatus }: StatusUpdaterProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Job Status
      </label>
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            disabled={isUpdating || status.value === currentStatus}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              status.value === currentStatus
                ? status.color + ' ring-2 ring-offset-2 ring-blue-500'
                : 'bg-white border hover:border-blue-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {status.label}
            {status.value === currentStatus && ' ✓'}
          </button>
        ))}
      </div>
      {isUpdating && (
        <p className="text-sm text-gray-500 mt-2">Updating status...</p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
