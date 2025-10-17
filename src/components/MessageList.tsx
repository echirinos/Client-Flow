'use client';

interface Message {
  id: string;
  senderType: string;
  body: string;
  createdAt: string;
}

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No messages yet</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg ${
              message.senderType === 'client'
                ? 'bg-blue-50 border-l-4 border-blue-500'
                : message.senderType === 'system'
                ? 'bg-gray-100 border-l-4 border-gray-400'
                : 'bg-green-50 border-l-4 border-green-500'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium">
                {message.senderType === 'client'
                  ? 'Client'
                  : message.senderType === 'system'
                  ? 'System'
                  : 'You'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{message.body}</p>
          </div>
        ))
      )}
    </div>
  );
}
