import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brickline | REI Lending Platform',
  description: 'Borrower intake, document uploads, and admin review workflows for real estate lending.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
