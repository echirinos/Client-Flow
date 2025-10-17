'use client';

import { useState } from 'react';

interface MessageComposerProps {
  jobId: string;
  senderType: 'owner' | 'client';
  clientToken?: string;
  onMessageSent?: () => void;
}

export default function MessageComposer({
  jobId,
  senderType,
  clientToken,
  onMessageSent,
}: MessageComposerProps) {
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = clientToken
        ? `/api/jobs/${jobId}/messages?t=${clientToken}`
        : `/api/jobs/${jobId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderType,
          body: body.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setBody('');
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !body.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
