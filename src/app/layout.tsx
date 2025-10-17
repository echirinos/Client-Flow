import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClientFlow - CRM Client Portal',
  description: 'Manage jobs and communicate with clients',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
