import './globals.css';
import { FirebaseBootstrap } from '@/components/FirebaseBootstrap';

export const metadata = {
  title: 'SplitMate | Roommate Bill Manager',
  description: 'Manage and split bills with roommates easily. Scan receipts and settle up with one tap.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  themeColor: '#215BA6',
  appleMobileWebappCapable: 'yes',
  appleMobileWebappStatusBarStyle: 'default',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-body antialiased selection:bg-primary/10">
        <FirebaseBootstrap>
          {children}
        </FirebaseBootstrap>
      </body>
    </html>
  );
}
