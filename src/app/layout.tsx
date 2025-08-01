import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'CareCanvas AI - Create Healthcare Apps with AI',
	description: 'Generate EHR-integrated healthcare applications with natural language',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
