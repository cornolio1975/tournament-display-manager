import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tournament Display Management | SP SportData Solution',
  description: 'Manage tournament display content, sponsors, videos, and public presentation screens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0B0F19] text-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
